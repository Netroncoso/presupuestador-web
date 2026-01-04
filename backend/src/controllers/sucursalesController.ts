import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { sucursalesService } from '../services/sucursalesService';

export const getSucursales = asyncHandler(async (req: Request, res: Response) => {
  const sucursales = await sucursalesService.obtenerTodas();
  res.json(sucursales);
});
