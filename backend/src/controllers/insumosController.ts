import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler } from '../middleware/errorHandler';

export const getInsumos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query(
    `SELECT 
      idInsumos, 
      producto, 
      costo,
      COALESCE(DATEDIFF(CURDATE(), fecha_actualizacion), 999) AS dias_sin_actualizar
     FROM insumos 
     ORDER BY producto`
  );
  res.json(rows);
});
