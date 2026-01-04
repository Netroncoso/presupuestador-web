import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { alertasServiciosService } from '../services/alertasServiciosService';

export const obtenerAlertasServicios = asyncHandler(async (req: Request, res: Response) => {
  const alertas = await alertasServiciosService.obtenerTodas();
  res.json(alertas);
});

export const actualizarAlertaServicio = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { cantidad_maxima, mensaje_alerta, color_alerta, activo } = req.body;

  const resultado = await alertasServiciosService.actualizar(id, {
    cantidad_maxima,
    mensaje_alerta,
    color_alerta,
    activo
  });

  res.json(resultado);
});

export const crearAlertaServicio = asyncHandler(async (req: Request, res: Response) => {
  const { tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo } = req.body;

  const resultado = await alertasServiciosService.crear({
    tipo_unidad,
    cantidad_maxima,
    mensaje_alerta,
    color_alerta,
    activo
  });

  res.status(201).json(resultado);
});
