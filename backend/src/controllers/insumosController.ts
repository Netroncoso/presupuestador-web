import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { insumosService } from '../services/insumosService';

export const getInsumos = asyncHandler(async (req: Request, res: Response) => {
  const insumos = await insumosService.obtenerTodos();
  res.json(insumos);
});
