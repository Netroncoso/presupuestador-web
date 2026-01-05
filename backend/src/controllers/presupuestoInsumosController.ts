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
 *   - false: Actualiza costos con precios actuales de tabla insumos
 *            y recalcula precio_facturar con porcentaje original (para edición)
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

  // Modo edición: Obtener con precios actuales en una sola query (JOIN)
  const [rows] = await pool.query<any[]>(`
    SELECT 
      pi.producto,
      COALESCE(i.costo, pi.costo) as costo,
      pi.cantidad,
      pi.id_insumo,
      p.porcentaje_insumos
    FROM presupuesto_insumos pi
    LEFT JOIN insumos i ON pi.id_insumo = i.idInsumos
    CROSS JOIN presupuestos p
    WHERE pi.idPresupuestos = ? AND p.idPresupuestos = ?
  `, [presupuestoId, presupuestoId]);

  // Calcular precio_facturar con porcentaje
  const resultado = rows.map((row: any) => ({
    producto: row.producto,
    costo: row.costo,
    precio_facturar: row.costo * (1 + (row.porcentaje_insumos || 0) / 100),
    cantidad: row.cantidad,
    id_insumo: row.id_insumo
  }));

  res.json(resultado);
});
