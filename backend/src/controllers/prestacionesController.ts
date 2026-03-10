import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { prestacionesService } from '../services/prestacionesService';

export const getFinanciadores = asyncHandler(async (req: Request, res: Response) => {
  const financiadores = await prestacionesService.obtenerFinanciadores();
  res.json(financiadores);
});

export const getPrestacionesPorFinanciador = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const fecha = (req.query.fecha as string) || new Date().toISOString().slice(0, 10);
  const zonaId = req.query.zona_id ? Number(req.query.zona_id) : null;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  const search = (req.query.search as string) || '';

  const prestaciones = await prestacionesService.obtenerPrestacionesPorFinanciador(id, fecha, zonaId, page, limit, search);
  res.json(prestaciones);
});

export const getFinanciadorInfo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const financiadorInfo = await prestacionesService.obtenerFinanciadorInfo(id);
  res.json(financiadorInfo);
});
