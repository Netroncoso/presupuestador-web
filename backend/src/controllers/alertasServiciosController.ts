import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { AlertasServicios, MutationResult } from '../types/database';

export const obtenerAlertasServicios = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<AlertasServicios[]>(
    'SELECT * FROM alertas_servicios ORDER BY tipo_unidad'
  );
  res.json(rows);
});

export const actualizarAlertaServicio = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { cantidad_maxima, mensaje_alerta, color_alerta, activo } = req.body;

  const [result] = await pool.query<MutationResult>(
    `UPDATE alertas_servicios 
     SET cantidad_maxima = ?, mensaje_alerta = ?, color_alerta = ?, activo = ?
     WHERE id = ?`,
    [cantidad_maxima, mensaje_alerta, color_alerta, activo, id]
  );

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Alerta no encontrada');
  }

  res.json({ ok: true, mensaje: 'Alerta actualizada' });
});

export const crearAlertaServicio = asyncHandler(async (req: Request, res: Response) => {
  const { tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo } = req.body;

  const [result] = await pool.query<MutationResult>(
    `INSERT INTO alertas_servicios (tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo)
     VALUES (?, ?, ?, ?, ?)`,
    [tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta || 'orange', activo ?? 1]
  );

  res.status(201).json({ ok: true, id: result.insertId });
});
