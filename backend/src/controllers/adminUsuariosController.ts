import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { usuariosService } from '../services/usuariosService';
import { AuthenticatedRequest } from '../types/express';

export const getUsuarios = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  
  const usuarios = await usuariosService.obtenerTodos(page, limit);
  res.json(usuarios);
});

export const createUsuario = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { username, password, rol, sucursal_id } = req.body;
  
  const result = await usuariosService.crear({ username, password, rol, sucursal_id });
  res.json(result);
});

export const updateUsuario = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { username, password, rol, sucursal_id } = req.body;
  
  const result = await usuariosService.actualizar(id, { username, rol, sucursal_id, password });
  res.json(result);
});

export const toggleUsuario = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { activo } = req.body;
  
  const result = await usuariosService.cambiarEstado(id, activo);
  res.json(result);
});

export const deleteUsuario = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const result = await usuariosService.eliminar(id);
  res.json(result);
});