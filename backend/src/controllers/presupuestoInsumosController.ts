import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// Helper para recalcular totales del presupuesto
const recalcularTotales = async (presupuestoId: number) => {
  // Calcular totales con una sola query combinada
  const [result] = await pool.query<any[]>(`
    SELECT 
      COALESCE(SUM(i.costo * i.cantidad), 0) as total_insumos_costo,
      COALESCE(SUM(i.precio_facturar * i.cantidad), 0) as total_insumos_facturar,
      COALESCE(SUM(pr.valor_asignado * pr.cantidad), 0) as total_prestaciones_costo,
      COALESCE(SUM(pr.valor_facturar * pr.cantidad), 0) as total_prestaciones_facturar,
      p.idobra_social,
      f.tasa_mensual,
      f.dias_cobranza_real,
      f.dias_cobranza_teorico
    FROM presupuestos p
    LEFT JOIN presupuesto_insumos i ON p.idPresupuestos = i.idPresupuestos
    LEFT JOIN presupuesto_prestaciones pr ON p.idPresupuestos = pr.idPresupuestos
    LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
    WHERE p.idPresupuestos = ?
    GROUP BY p.idPresupuestos, p.idobra_social, f.tasa_mensual, f.dias_cobranza_real, f.dias_cobranza_teorico
  `, [presupuestoId]);
  
  if (result.length === 0) return;
  
  const data = result[0];
  const totalInsumos = Number(data.total_insumos_costo);
  const totalPrestaciones = Number(data.total_prestaciones_costo);
  const costoTotal = totalInsumos + totalPrestaciones;
  const totalFacturar = Number(data.total_insumos_facturar) + Number(data.total_prestaciones_facturar);
  const rentabilidad = costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;
  
  let rentabilidadConPlazo = rentabilidad;
  
  if (data.idobra_social && costoTotal > 0 && data.tasa_mensual) {
    const diasCobranza = data.dias_cobranza_real || data.dias_cobranza_teorico || 30;
    const tasaMensual = (data.tasa_mensual || 2) / 100;
    const mesesCobranza = Math.floor(diasCobranza / 30);
    const valorPresente = totalFacturar / Math.pow(1 + tasaMensual, mesesCobranza);
    const utilidadConPlazo = valorPresente - costoTotal;
    rentabilidadConPlazo = (utilidadConPlazo / costoTotal) * 100;
  }
  
  await pool.query(`
    UPDATE presupuestos SET 
      total_insumos = ?,
      total_prestaciones = ?,
      costo_total = ?,
      total_facturar = ?,
      rentabilidad = ?,
      rentabilidad_con_plazo = ?
    WHERE idPresupuestos = ?
  `, [totalInsumos, totalPrestaciones, costoTotal, totalFacturar, rentabilidad, rentabilidadConPlazo, presupuestoId]);
};

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
  
  // Recalcular totales
  await recalcularTotales(presupuestoId);

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
  
  await recalcularTotales(presupuestoId);

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
