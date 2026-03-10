import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { presupuestoCalculosService } from '../services/presupuestoCalculosService';

export const guardarPrestacionPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { id_servicio, prestacion, cantidad, valor_asignado, valor_facturar } = req.body;

  if (isNaN(presupuestoId) || !id_servicio || !prestacion || !cantidad || !valor_asignado) {
    throw new AppError(400, 'Datos inválidos');
  }

  // Obtener zonas y financiador del presupuesto
  const [presupuesto] = await pool.query<any[]>(
    'SELECT zona_financiador_id, zona_tarifario_id, financiador_id FROM presupuestos WHERE idPresupuestos = ?',
    [presupuestoId]
  );

  if (!presupuesto.length) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const { zona_financiador_id, zona_tarifario_id, financiador_id } = presupuesto[0];

  // Verificar si ya existe (evitar duplicados)
  const [existing] = await pool.query<any[]>(
    'SELECT id FROM presupuesto_prestaciones WHERE idPresupuestos = ? AND servicio_id = ? AND aplicar_horas_nocturnas = ?',
    [presupuestoId, id_servicio, req.body.aplicar_horas_nocturnas || 0]
  );

  if (existing.length > 0) {
    throw new AppError(400, 'Este servicio con esta configuración ya fue agregado');
  }

  // Buscar id_financiador_servicio (acuerdo específico)
  let id_financiador_servicio = null;
  if (financiador_id && id_servicio) {
    const [acuerdo] = await pool.query<any[]>(
      'SELECT id FROM financiador_servicio WHERE financiador_id = ? AND servicio_id = ?',
      [financiador_id, id_servicio]
    );
    id_financiador_servicio = acuerdo.length ? acuerdo[0].id : null;
  }

  await pool.query(
    `INSERT INTO presupuesto_prestaciones 
     (idPresupuestos, servicio_id, id_servicio, id_financiador_servicio, zona_financiador_id, zona_tarifario_id, prestacion, cantidad, valor_asignado, valor_facturar, aplicar_horas_nocturnas, porcentaje_aplicado) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [presupuestoId, id_servicio, String(id_financiador_servicio || id_servicio), id_financiador_servicio, zona_financiador_id, zona_tarifario_id, prestacion, cantidad, valor_asignado, valor_facturar, req.body.aplicar_horas_nocturnas || 0, req.body.porcentaje_aplicado || 0]
  );

   await presupuestoCalculosService.recalcularTotales(presupuestoId);

  res.json({ ok: true });
});

export const eliminarPrestacionPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { id_servicio, aplicar_horas_nocturnas } = req.body;

  if (isNaN(presupuestoId) || !id_servicio) {
    throw new AppError(400, 'Datos inválidos');
  }

  await pool.query(
    'DELETE FROM presupuesto_prestaciones WHERE idPresupuestos = ? AND servicio_id = ? AND aplicar_horas_nocturnas = ?',
    [presupuestoId, id_servicio, aplicar_horas_nocturnas || 0]
  );
  
  // await presupuestoCalculosService.recalcularTotales(presupuestoId);

  res.json({ ok: true });
});

/**
 * Obtiene prestaciones de un presupuesto
 * @param soloLectura - Query param que determina el comportamiento:
 *   - true: Devuelve valores históricos guardados (snapshots)
 *   - false: Actualiza a valores vigentes actuales
 */
export const obtenerPrestacionesPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const soloLectura = req.query.soloLectura === 'true';

  if (isNaN(presupuestoId)) {
    throw new AppError(400, 'ID inválido');
  }

  // Modo solo lectura: devolver snapshots históricos
  if (soloLectura) {
    const [rows] = await pool.query<any[]>(
      `SELECT pp.id_servicio, pp.prestacion, pp.cantidad, pp.valor_asignado, pp.valor_facturar, 
              pp.servicio_id, pp.id_financiador_servicio, pp.zona_financiador_id, pp.zona_tarifario_id, 
              pp.aplicar_horas_nocturnas, pp.porcentaje_aplicado, s.tipo_unidad, fs.codigo_financiador
       FROM presupuesto_prestaciones pp
       LEFT JOIN servicios s ON pp.servicio_id = s.id
       LEFT JOIN financiador_servicio fs ON pp.id_financiador_servicio = fs.id
       WHERE pp.idPresupuestos = ?`,
      [presupuestoId]
    );
    return res.json(rows);
  }

  // Modo edición: actualizar a valores vigentes actuales
  const [rows] = await pool.query<any[]>(`
    SELECT 
      pp.id,
      pp.id_servicio,
      pp.servicio_id,
      pp.id_financiador_servicio,
      pp.zona_financiador_id,
      pp.zona_tarifario_id,
      pp.prestacion,
      pp.cantidad,
      pp.valor_asignado,
      pp.valor_facturar,
      pp.aplicar_horas_nocturnas,
      pp.porcentaje_aplicado,
      s.tipo_unidad
    FROM presupuesto_prestaciones pp
    LEFT JOIN servicios s ON pp.servicio_id = s.id
    WHERE pp.idPresupuestos = ?
  `, [presupuestoId]);

  res.json(rows);
});
