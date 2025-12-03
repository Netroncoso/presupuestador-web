import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { TiposUnidad, MutationResult } from '../types/database';

export const obtenerTiposUnidad = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<TiposUnidad[]>(
    'SELECT * FROM tipos_unidad WHERE activo = 1 ORDER BY nombre'
  );
  res.json(rows);
});

export const crearTipoUnidad = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    throw new AppError(400, 'El nombre es requerido');
  }

  const [result] = await pool.query<MutationResult>(
    'INSERT INTO tipos_unidad (nombre, descripcion) VALUES (?, ?)',
    [nombre, descripcion]
  );

  res.status(201).json({ ok: true, id: result.insertId });
});
