import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { presupuestoCalculosService } from '../services/presupuestoCalculosService';

export const guardarInsumoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { producto, costo, cantidad, id_insumo, insumo_id } = req.body;
  
  // Accept both field names from frontend
  const insumoIdFinal = id_insumo || insumo_id;

  if (isNaN(presupuestoId) || !producto || !costo || !cantidad) {
    throw new AppError(400, 'Datos inválidos');
  }

  // Obtener porcentaje del presupuesto
  const [presupuesto] = await pool.query<any[]>(
    'SELECT porcentaje_insumos FROM presupuestos WHERE idPresupuestos = ?',
    [presupuestoId]
  );
  
  const porcentaje = presupuesto[0]?.porcentaje_insumos || 0;
  const precio_facturar = costo * (1 + porcentaje / 100);

  await pool.query(
    'INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, precio_facturar, cantidad, id_insumo) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE costo = VALUES(costo), precio_facturar = VALUES(precio_facturar), cantidad = VALUES(cantidad), id_insumo = VALUES(id_insumo)',
    [presupuestoId, producto, costo, precio_facturar, cantidad, insumoIdFinal || null]
  );
  
  await presupuestoCalculosService.recalcularTotales(presupuestoId);

  res.json({ ok: true });
});

export const eliminarInsumoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { id } = req.body;

  if (isNaN(presupuestoId) || !id) {
    throw new AppError(400, 'Datos inválidos');
  }

  await pool.query(
    'DELETE FROM presupuesto_insumos WHERE id = ? AND idPresupuestos = ?',
    [id, presupuestoId]
  );
  
  await presupuestoCalculosService.recalcularTotales(presupuestoId);

  res.json({ ok: true });
});

/**
 * Obtiene insumos de un presupuesto
 * @param soloLectura - Query param que determina el comportamiento:
 *   - true: Devuelve costos históricos guardados (para visualización)
 *   - false: Actualiza costos con precios actuales de tabla insumos,
 *            recalcula porcentaje total actual (sucursal + financiador),
 *            actualiza presupuesto.porcentaje_insumos si cambió,
 *            y recalcula precio_facturar de todos los insumos (para edición)
 */
export const obtenerInsumosPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const soloLectura = req.query.soloLectura === 'true';

  if (isNaN(presupuestoId)) {
    throw new AppError(400, 'ID inválido');
  }

  // Si es solo lectura, devolver datos históricos guardados
  if (soloLectura) {
    const [rows] = await pool.query<any[]>(
      'SELECT producto, costo, precio_facturar, cantidad, id_insumo FROM presupuesto_insumos WHERE idPresupuestos = ?',
      [presupuestoId]
    );
    return res.json(rows);
  }

  // Modo edición: Calcular porcentaje total ACTUAL
  const [presupuesto] = await pool.query<any[]>(`
    SELECT 
      p.porcentaje_insumos as porcentaje_guardado,
      p.sucursal_id,
      p.financiador_id,
      COALESCE(s.suc_porcentaje_insumos, 0) as porcentaje_sucursal,
      COALESCE(f.porcentaje_insumos, 0) as porcentaje_financiador
    FROM presupuestos p
    LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
    LEFT JOIN financiador f ON p.financiador_id = f.id
    WHERE p.idPresupuestos = ?
  `, [presupuestoId]);

  if (presupuesto.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const porcentajeSucursal = Number(presupuesto[0].porcentaje_sucursal) || 0;
  const porcentajeFinanciador = Number(presupuesto[0].porcentaje_financiador) || 0;
  const porcentajeTotalActual = porcentajeSucursal + porcentajeFinanciador;
  const porcentajeGuardado = Number(presupuesto[0].porcentaje_guardado) || 0;

  // Si el porcentaje cambió, actualizar en BD
  if (porcentajeTotalActual !== porcentajeGuardado) {
    await pool.query(
      'UPDATE presupuestos SET porcentaje_insumos = ? WHERE idPresupuestos = ?',
      [porcentajeTotalActual, presupuestoId]
    );

    // Actualizar precio_facturar de todos los insumos existentes con nuevo porcentaje
    await pool.query(`
      UPDATE presupuesto_insumos pi
      LEFT JOIN insumos i ON pi.id_insumo = i.idInsumos
      SET pi.costo = COALESCE(i.costo, pi.costo),
          pi.precio_facturar = COALESCE(i.costo, pi.costo) * (1 + ? / 100)
      WHERE pi.idPresupuestos = ?
    `, [porcentajeTotalActual, presupuestoId]);
  }

  // Obtener insumos con precios actualizados
  const [rows] = await pool.query<any[]>(`
    SELECT 
      pi.id,
      pi.producto,
      COALESCE(i.costo, pi.costo) as costo,
      pi.cantidad,
      pi.id_insumo
    FROM presupuesto_insumos pi
    LEFT JOIN insumos i ON pi.id_insumo = i.idInsumos
    WHERE pi.idPresupuestos = ?
  `, [presupuestoId]);

  // Calcular precio_facturar con porcentaje ACTUAL
  const resultado = rows.map((row: any) => ({
    id: row.id,
    producto: row.producto,
    costo: row.costo,
    precio_facturar: row.costo * (1 + porcentajeTotalActual / 100),
    cantidad: row.cantidad,
    id_insumo: row.id_insumo
  }));

  res.json(resultado);
});
