import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

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