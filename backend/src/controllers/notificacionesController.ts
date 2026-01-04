import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { notificacionesService } from '../services/notificacionesService';

// Obtener notificaciones del usuario
export const obtenerNotificaciones = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const usuarioId = req.user?.id;
  const filtros = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    estado: req.query.estado as string,
    paciente: req.query.paciente as string,
    presupuesto_id: req.query.presupuesto_id as string
  };
  
  const notificaciones = await notificacionesService.obtener(usuarioId, filtros);
  res.json(notificaciones);
});

// Marcar notificación como leída
export const marcarComoLeida = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const usuarioId = req.user?.id;
  
  const resultado = await notificacionesService.marcarComoLeida(id, usuarioId);
  res.json(resultado);
});

// Obtener contador de notificaciones no leídas
export const contarNoLeidas = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const usuarioId = req.user?.id;
  const resultado = await notificacionesService.contarNoLeidas(usuarioId);
  res.json(resultado);
});

// Marcar todas como leídas
export const marcarTodasLeidas = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const usuarioId = req.user?.id;
  const resultado = await notificacionesService.marcarTodasLeidas(usuarioId);
  res.json(resultado);
});