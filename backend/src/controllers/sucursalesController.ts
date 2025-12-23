import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cacheService';

export const getSucursales = asyncHandler(async (req: Request, res: Response) => {
  const cacheKey = 'catalogos:sucursales';
  const cached = cacheService.get(cacheKey);
  if (cached) return res.json(cached);
  
  const [rows] = await pool.query('SELECT ID, Sucursales_mh, suc_porcentaje_insumos FROM sucursales_mh ORDER BY Sucursales_mh');
  cacheService.set(cacheKey, rows, 1800); // 30 min
  res.json(rows);
});
