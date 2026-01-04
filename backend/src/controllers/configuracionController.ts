import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { configuracionService } from '../services/configuracionService';

export const obtenerConfiguracion = asyncHandler(async (req: Request, res: Response) => {
  const { categoria } = req.query;
  const configuraciones = await configuracionService.obtener(categoria as string);
  res.json(configuraciones);
});

export const actualizarConfiguracion = asyncHandler(async (req: Request, res: Response) => {
  const { clave, valor } = req.body;
  const resultado = await configuracionService.actualizar(clave, valor);
  res.json(resultado);
});

export const actualizarMultiple = asyncHandler(async (req: Request, res: Response) => {
  const { configuraciones } = req.body;
  const resultado = await configuracionService.actualizarMultiple(configuraciones);
  res.json(resultado);
});
