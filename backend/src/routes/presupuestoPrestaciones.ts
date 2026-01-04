import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { guardarPrestacionPresupuesto, eliminarPrestacionPresupuesto, obtenerPrestacionesPresupuesto } from '../controllers/presupuestoPrestacionesController';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validatePresupuestoId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de presupuesto debe ser un número válido' });
  }
  next();
};

const validatePrestacionData = (req: Request, res: Response, next: NextFunction) => {
  const { prestador_servicio_id, id_servicio, cantidad, valor_asignado, valor_facturar } = req.body;
  
  // Accept both field names from frontend
  const servicioId = prestador_servicio_id || id_servicio;
  if (!servicioId || isNaN(parseInt(servicioId))) {
    return res.status(400).json({ error: 'ID de prestador servicio válido es requerido' });
  }
  
  if (!cantidad || isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0) {
    return res.status(400).json({ error: 'Cantidad válida es requerida' });
  }
  
  if (valor_asignado !== undefined && (isNaN(parseFloat(valor_asignado)) || parseFloat(valor_asignado) < 0)) {
    return res.status(400).json({ error: 'Valor asignado debe ser un número válido' });
  }
  
  if (valor_facturar !== undefined && (isNaN(parseFloat(valor_facturar)) || parseFloat(valor_facturar) < 0)) {
    return res.status(400).json({ error: 'Valor facturar debe ser un número válido' });
  }
  
  next();
};

const validatePrestadorServicioIdQuery = (req: Request, res: Response, next: NextFunction) => {
  const prestador_servicio_id = parseInt(req.query.prestador_servicio_id as string);
  if (isNaN(prestador_servicio_id) || prestador_servicio_id <= 0) {
    return res.status(400).json({ error: 'ID de prestador servicio válido es requerido en query' });
  }
  next();
};

const router = Router();

/**
 * @swagger
 * /api/presupuesto-prestaciones/{id}:
 *   get:
 *     tags: [Presupuestos - Items]
 *     summary: Obtener prestaciones de un presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de prestaciones del presupuesto
 */
router.get('/:id', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Obteniendo prestaciones de presupuesto', { 
    presupuestoId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await obtenerPrestacionesPresupuesto(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/presupuestos/{id}/prestaciones:
 *   post:
 *     tags: [Presupuestos - Items]
 *     summary: Agregar prestación a presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [prestador_servicio_id, cantidad, valor_asignado, valor_facturar]
 *             properties:
 *               prestador_servicio_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               valor_asignado:
 *                 type: number
 *               valor_facturar:
 *                 type: number
 *     responses:
 *       201:
 *         description: Prestación agregada
 */
router.post('/:id/prestaciones', authenticateToken, validatePresupuestoId, validatePrestacionData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { prestador_servicio_id, cantidad, valor_asignado, valor_facturar } = req.body;
  
  logger.info('Agregando prestación a presupuesto', { 
    presupuestoId: id, 
    prestadorServicioId: prestador_servicio_id, 
    cantidad, 
    valor_asignado, 
    valor_facturar,
    usuario: req.user.id 
  });
  
  const resultado = await guardarPrestacionPresupuesto(req, res, () => {});
  
  logger.info('Prestación agregada exitosamente', { 
    presupuestoId: id, 
    prestadorServicioId: prestador_servicio_id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/presupuestos/{id}/prestaciones:
 *   delete:
 *     tags: [Presupuestos - Items]
 *     summary: Eliminar prestación de presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: prestador_servicio_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prestación eliminada
 */
router.delete('/:id/prestaciones', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { id_servicio } = req.body;
  
  if (!id_servicio) {
    return res.status(400).json({ error: 'ID de servicio es requerido' });
  }
  
  logger.info('Eliminando prestación de presupuesto', { 
    presupuestoId: id, 
    servicioId: id_servicio, 
    usuario: req.user.id 
  });
  
  const resultado = await eliminarPrestacionPresupuesto(req, res, () => {});
  
  logger.info('Prestación eliminada exitosamente', { 
    presupuestoId: id, 
    servicioId: id_servicio, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

// Ruta duplicada para compatibilidad
router.get('/:id/prestaciones', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Obteniendo prestaciones de presupuesto (ruta alternativa)', { 
    presupuestoId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await obtenerPrestacionesPresupuesto(req, res, () => {});
  return resultado;
}));

export default router;
