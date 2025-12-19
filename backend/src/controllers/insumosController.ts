import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../middleware/errorHandler';

export const getInsumos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT idInsumos, producto, costo FROM insumos ORDER BY producto');
  res.json(rows);
});
