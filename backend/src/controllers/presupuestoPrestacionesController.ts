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

export const guardarPrestacionPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { id_servicio, prestacion, cantidad, valor_asignado, valor_facturar } = req.body;

  if (isNaN(presupuestoId) || !id_servicio || !prestacion || !cantidad || !valor_asignado || !valor_facturar) {
    throw new AppError(400, 'Datos inválidos');
  }

  await pool.query(
    'INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE prestacion = VALUES(prestacion), cantidad = VALUES(cantidad), valor_asignado = VALUES(valor_asignado), valor_facturar = VALUES(valor_facturar)',
    [presupuestoId, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar]
  );
  
  // Recalcular totales
  await recalcularTotales(presupuestoId);

  res.json({ ok: true });
});

export const eliminarPrestacionPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { id_servicio } = req.body;

  if (isNaN(presupuestoId) || !id_servicio) {
    throw new AppError(400, 'Datos inválidos');
  }

  await pool.query(
    'DELETE FROM presupuesto_prestaciones WHERE idPresupuestos = ? AND id_servicio = ?',
    [presupuestoId, id_servicio]
  );
  
  // Recalcular totales
  await recalcularTotales(presupuestoId);

  res.json({ ok: true });
});

export const obtenerPrestacionesPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);

  if (isNaN(presupuestoId)) {
    throw new AppError(400, 'ID inválido');
  }

  const [rows] = await pool.query(
    'SELECT id_servicio, prestacion, cantidad, valor_asignado, valor_facturar FROM presupuesto_prestaciones WHERE idPresupuestos = ?',
    [presupuestoId]
  );

  res.json(rows);
});