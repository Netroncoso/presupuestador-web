import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { tiposUnidadService } from '../services/tiposUnidadService';

export const obtenerTiposUnidad = asyncHandler(async (req: Request, res: Response) => {
  const tipos = await tiposUnidadService.obtenerActivos();
  res.json(tipos);
});

export const crearTipoUnidad = asyncHandler(async (req: Request, res: Response) => {
  const { nombre, descripcion } = req.body;
  const resultado = await tiposUnidadService.crear(nombre, descripcion);
  res.status(201).json(resultado);
});
