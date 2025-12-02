import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../middleware/errorHandler';

export const getSucursales = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT ID, Sucursales_mh, suc_porcentaje_insumos FROM sucursales_mh ORDER BY Sucursales_mh');
  res.json(rows);
});
