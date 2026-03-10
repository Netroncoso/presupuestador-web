import { Request, Response } from 'express';
import { financiadorZonasService } from '../services/financiadorZonasService';
import { AppError } from '../middleware/errorHandler';

export class FinanciadorZonasController {

  // GET /api/financiador-zonas
  async obtenerTodasZonas(req: Request, res: Response) {
    try {
      const zonas = await financiadorZonasService.obtenerTodasZonas();
      res.json(zonas);
    } catch (error) {
      throw new AppError(500, 'Error al obtener zonas de financiador');
    }
  }

  // GET /api/financiadores/:id/zonas
  async obtenerZonasPorFinanciador(req: Request, res: Response) {
    try {
      const financiadorId = parseInt(req.params.id);
      const zonas = await financiadorZonasService.obtenerZonasPorFinanciador(financiadorId);
      res.json(zonas);
    } catch (error) {
      throw new AppError(500, 'Error al obtener zonas del financiador');
    }
  }

  // GET /api/financiadores/:financiadorId/zonas/:zonaId/servicios
  async obtenerServiciosConvenio(req: Request, res: Response) {
    try {
      const financiadorId = parseInt(req.params.financiadorId);
      const zonaId = parseInt(req.params.zonaId);
      const servicios = await financiadorZonasService.obtenerServiciosConvenio(financiadorId, zonaId);
      res.json(servicios);
    } catch (error) {
      throw new AppError(500, 'Error al obtener servicios con convenio');
    }
  }

  // GET /api/tarifario/zonas/:zonaId/servicios
  async obtenerServiciosTarifario(req: Request, res: Response) {
    try {
      const zonaId = parseInt(req.params.zonaId);
      const servicios = await financiadorZonasService.obtenerServiciosTarifario(zonaId);
      res.json(servicios);
    } catch (error) {
      throw new AppError(500, 'Error al obtener servicios del tarifario');
    }
  }

  // GET /api/financiador/:financiadorId/valores-vigentes
  async obtenerValoresVigentes(req: Request, res: Response) {
    try {
      const financiadorId = parseInt(req.params.financiadorId);
      const { servicio_nombre } = req.query;
      
      const valoresVigentes = await financiadorZonasService.obtenerValoresVigentes(
        financiadorId, 
        servicio_nombre as string
      );
      
      res.json(valoresVigentes);
    } catch (error) {
      throw new AppError(500, 'Error al obtener valores vigentes');
    }
  }

  // GET /api/financiador/:financiadorId/completar-datos
  async completarDatosConvenio(req: Request, res: Response) {
    try {
      const financiadorId = parseInt(req.params.financiadorId);
      const { dni } = req.query;
      
      if (!dni) {
        throw new AppError(400, 'DNI es requerido');
      }
      
      const datosCompletos = await financiadorZonasService.completarDatosConvenio(
        financiadorId,
        dni as string
      );
      
      res.json(datosCompletos);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al completar datos del convenio');
    }
  }

  // POST /api/financiadores/:id/zonas
  async asignarZonas(req: Request, res: Response) {
    try {
      const financiadorId = parseInt(req.params.id);
      const { zonaIds } = req.body;

      if (!Array.isArray(zonaIds)) {
        throw new AppError(400, 'zonaIds debe ser un array');
      }

      const result = await financiadorZonasService.asignarZonas(financiadorId, zonaIds);
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al asignar zonas');
    }
  }

  // POST /api/financiador-zonas
  async crearZona(req: Request, res: Response) {
    try {
      const { nombre, descripcion } = req.body;

      if (!nombre) {
        throw new AppError(400, 'El nombre es requerido');
      }

      const result = await financiadorZonasService.crearZona(nombre, descripcion);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al crear zona');
    }
  }

  // PUT /api/financiador-zonas/:id
  async actualizarZona(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { nombre, descripcion, activo } = req.body;

      if (!nombre) {
        throw new AppError(400, 'El nombre es requerido');
      }

      const result = await financiadorZonasService.actualizarZona(id, nombre, descripcion, activo);
      res.json(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, 'Error al actualizar zona');
    }
  }
}

export const financiadorZonasController = new FinanciadorZonasController();