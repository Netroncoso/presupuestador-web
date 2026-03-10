import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { adminInsumosService } from '../../services/adminInsumosService';

export const getAllInsumos = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const search = (req.query.search as string) || '';

  const insumos = await adminInsumosService.obtenerTodos(page, limit, search);
  res.json(insumos);
});

export const createInsumo = asyncHandler(async (req: Request, res: Response) => {
  const { producto, costo, codigo_producto } = req.body;
  const resultado = await adminInsumosService.crear({ producto, costo, codigo_producto });
  res.status(201).json(resultado);
});

export const updateInsumo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { producto, costo, codigo_producto } = req.body;
  const resultado = await adminInsumosService.actualizar(id, { producto, costo, codigo_producto });
  res.json(resultado);
});

export const deleteInsumo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const resultado = await adminInsumosService.eliminar(id);
  res.json(resultado);
});

export const toggleCritico = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { critico } = req.body;
  const resultado = await adminInsumosService.toggleCritico(id, critico);
  res.json(resultado);
});
