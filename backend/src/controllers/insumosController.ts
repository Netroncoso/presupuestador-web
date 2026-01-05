import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { insumosService } from '../services/insumosService';

export const getInsumos = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  
  const result = await insumosService.obtenerTodos(page, limit);
  res.json(result);
});
