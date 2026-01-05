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

  // Obtener fecha y financiador del presupuesto
  const [presupuesto] = await pool.query<any[]>(
    'SELECT created_at, idobra_social FROM presupuestos WHERE idPresupuestos = ?',
    [presupuestoId]
  );
  
  if (!presupuesto.length) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }
  
  const fechaPresupuesto = new Date(presupuesto[0].created_at).toISOString().slice(0, 10);
  const idobra_social = presupuesto[0].idobra_social;
  
  // Obtener id_prestador_servicio desde id_servicio
  const [servicio] = await pool.query<any[]>(
    'SELECT id_prestador_servicio FROM prestador_servicio WHERE id_servicio = ? AND idobra_social = ?',
    [id_servicio, idobra_social]
  );
  
  if (!servicio.length) {
    throw new AppError(400, 'Servicio no encontrado para este financiador');
  }
  
  const id_prestador_servicio = servicio[0].id_prestador_servicio;
  
  // Consultar valor_facturar histórico (valor_asignado viene del usuario)
  const [valores] = await pool.query<any[]>(
    `SELECT valor_facturar 
     FROM prestador_servicio_valores 
     WHERE id_prestador_servicio = ? 
       AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
     LIMIT 1`,
    [id_prestador_servicio, fechaPresupuesto]
  );
  
  let valor_facturar_final;
  
  if (valores.length > 0) {
    valor_facturar_final = valores[0].valor_facturar;
  } else if (valor_facturar) {
    // Si no hay valores históricos, usar el enviado por el frontend
    valor_facturar_final = valor_facturar;
  } else {
    // Fallback a tabla prestador_servicio
    const [fallback] = await pool.query<any[]>(
      'SELECT valor_facturar FROM prestador_servicio WHERE id_prestador_servicio = ?',
      [id_prestador_servicio]
    );
    
    if (!fallback.length) {
      throw new AppError(400, 'No se encontró valor_facturar para este servicio');
    }
    
    valor_facturar_final = fallback[0].valor_facturar;
  }

  await pool.query(
    `INSERT INTO presupuesto_prestaciones 
     (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) 
     VALUES (?, ?, ?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE 
       prestacion = VALUES(prestacion), 
       cantidad = VALUES(cantidad), 
       valor_asignado = VALUES(valor_asignado), 
       valor_facturar = VALUES(valor_facturar)`,
    [presupuestoId, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar_final]
  );
  
  await presupuestoCalculosService.recalcularTotales(presupuestoId);

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
  
  await presupuestoCalculosService.recalcularTotales(presupuestoId);

  res.json({ ok: true });
});

/**
 * Obtiene prestaciones de un presupuesto
 * @param soloLectura - Query param que determina el comportamiento:
 *   - true: Devuelve valores históricos guardados (para visualización)
 *   - false: Mantiene valor_asignado original pero actualiza valor_facturar
 *            con precios vigentes actuales de prestador_servicio_valores (para edición)
 */
export const obtenerPrestacionesPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const soloLectura = req.query.soloLectura === 'true';

  if (isNaN(presupuestoId)) {
    throw new AppError(400, 'ID inválido');
  }

  // Si es solo lectura, devolver datos históricos guardados
  if (soloLectura) {
    const [rows] = await pool.query<any[]>(
      `SELECT pp.id_servicio, pp.prestacion, pp.cantidad, pp.valor_asignado, pp.valor_facturar, s.tipo_unidad
       FROM presupuesto_prestaciones pp
       LEFT JOIN servicios s ON pp.id_servicio = s.id_servicio
       WHERE pp.idPresupuestos = ?`,
      [presupuestoId]
    );
    return res.json(rows);
  }

  // Modo edición: Obtener con valores actuales en una sola query (JOINs)
  const [rows] = await pool.query<any[]>(`
    SELECT 
      pp.id_servicio,
      pp.prestacion,
      pp.cantidad,
      pp.valor_asignado,
      COALESCE(psv.valor_facturar, pp.valor_facturar) as valor_facturar,
      s.tipo_unidad
    FROM presupuesto_prestaciones pp
    INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
    LEFT JOIN prestador_servicio ps 
      ON pp.id_servicio = ps.id_servicio 
      AND ps.idobra_social = p.idobra_social
    LEFT JOIN prestador_servicio_valores psv 
      ON ps.id_prestador_servicio = psv.id_prestador_servicio
      AND CURDATE() BETWEEN psv.fecha_inicio AND COALESCE(psv.fecha_fin, '9999-12-31')
    LEFT JOIN servicios s ON pp.id_servicio = s.id_servicio
    WHERE pp.idPresupuestos = ?
  `, [presupuestoId]);

  res.json(rows);
});
