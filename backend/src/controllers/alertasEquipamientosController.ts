import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { alertasEquipamientosService } from '../services/alertasEquipamientosService';

export const obtenerAlertasEquipamientos = asyncHandler(async (req: Request, res: Response) => {
  const alertas = await alertasEquipamientosService.obtenerTodas();
  res.json(alertas);
});

export const actualizarAlertaEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta } = req.body;

  const resultado = await alertasEquipamientosService.actualizar(id, {
    cantidad_maxima,
    mensaje_alerta,
    color_alerta,
    activo_alerta
  });

  res.json(resultado);
});
