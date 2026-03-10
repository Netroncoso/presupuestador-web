import { Request, Response } from 'express';
import { tarifarioValoresService } from '../services/tarifarioValoresService';
import { AppError } from '../middleware/errorHandler';

export class TarifarioValoresController {

  // GET /api/tarifario/zonas/:zonaId/servicios
  async obtenerServiciosPorZona(req: Request, res: Response) {
    try {
      const zonaId = parseInt(req.params.zonaId);
      const servicios = await tarifarioValoresService.obtenerServiciosPorZona(zonaId);
      res.json({ servicios });
    } catch (error) {
      throw new AppError(500, 'Error al obtener servicios del tarifario');
    }
  }

  // POST /api/admin/tarifario/valores
  async crearOActualizarValores(req: Request, res: Response) {
    try {
      const {
        servicio_id,
        zona_tarifario_id,
        valor_1,
        valor_2,
        valor_3,
        valor_4,
        valor_5,
        fecha_inicio,
        fecha_fin
      } = req.body;

      if (!servicio_id || !zona_tarifario_id || !fecha_inicio) {
        throw new AppError(400, 'Faltan campos requeridos');
      }

      const result = await tarifarioValoresService.crearOActualizarValores({
        servicio_id,
        zona_tarifario_id,
        valor_1: parseFloat(valor_1) || 0,
        valor_2: parseFloat(valor_2) || 0,
        valor_3: parseFloat(valor_3) || 0,
        valor_4: parseFloat(valor_4) || 0,
        valor_5: parseFloat(valor_5) || 0,
        fecha_inicio,
        fecha_fin
      });

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al guardar valores del tarifario');
    }
  }

  // GET /api/admin/tarifario/servicios/:servicioId/zonas/:zonaId/historial
  async obtenerHistorialValores(req: Request, res: Response) {
    try {
      const servicioId = parseInt(req.params.servicioId);
      const zonaId = parseInt(req.params.zonaId);
      
      const historial = await tarifarioValoresService.obtenerHistorialValores(servicioId, zonaId);
      res.json({ historial });
    } catch (error) {
      throw new AppError(500, 'Error al obtener historial de valores');
    }
  }
}

export const tarifarioValoresController = new TarifarioValoresController();