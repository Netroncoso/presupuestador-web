import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../middleware/errorHandler';

export const getSucursales = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT Sucursales_mh, suc_porcentaje_insumos FROM sucursales_mh');
  res.json(rows);
});
