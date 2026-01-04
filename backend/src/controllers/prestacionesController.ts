import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prestacionesService } from '../services/prestacionesService';

export const getPrestadores = asyncHandler(async (req: Request, res: Response) => {
  const prestadores = await prestacionesService.obtenerPrestadores();
  res.json(prestadores);
});

export const getPrestacionesPorPrestador = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fecha = (req.query.fecha as string) || new Date().toISOString().slice(0, 10);
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : null;
  
  const prestaciones = await prestacionesService.obtenerPrestacionesPorPrestador(id, fecha, sucursalId);
  res.json(prestaciones);
});

export const getPrestadorInfo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const prestadorInfo = await prestacionesService.obtenerPrestadorInfo(id);
  res.json(prestadorInfo);
});
