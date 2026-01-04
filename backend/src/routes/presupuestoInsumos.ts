import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import { guardarInsumoPresupuesto, eliminarInsumoPresupuesto, obtenerInsumosPresupuesto } from '../controllers/presupuestoInsumosController';
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

const validateInsumoData = (req: Request, res: Response, next: NextFunction) => {
  const { insumo_id, id_insumo, cantidad, costo, precio_facturar } = req.body;
  
  // ID de insumo es opcional (puede ser null para insumos sin ID)
  const insumoId = insumo_id || id_insumo;
  if (insumoId !== null && insumoId !== undefined && (isNaN(parseInt(insumoId)) || parseInt(insumoId) <= 0)) {
    return res.status(400).json({ error: 'ID de insumo debe ser un número válido si se proporciona' });
  }
  
  if (!cantidad || isNaN(parseFloat(cantidad)) || parseFloat(cantidad) <= 0) {
    return res.status(400).json({ error: 'Cantidad válida es requerida' });
  }
  
  if (costo !== undefined && (isNaN(parseFloat(costo)) || parseFloat(costo) < 0)) {
    return res.status(400).json({ error: 'Costo debe ser un número válido' });
  }
  
  if (precio_facturar !== undefined && (isNaN(parseFloat(precio_facturar)) || parseFloat(precio_facturar) < 0)) {
    return res.status(400).json({ error: 'Precio facturar debe ser un número válido' });
  }
  
  next();
};

const validateInsumoIdQuery = (req: Request, res: Response, next: NextFunction) => {
  const insumo_id = parseInt(req.query.insumo_id as string);
  if (isNaN(insumo_id) || insumo_id <= 0) {
    return res.status(400).json({ error: 'ID de insumo válido es requerido en query' });
  }
  next();
};

const router = Router();

/**
 * @swagger
 * /api/presupuesto-insumos/{id}:
 *   get:
 *     tags: [Presupuestos - Items]
 *     summary: Obtener insumos de un presupuesto
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
 *         description: Lista de insumos del presupuesto
 */
router.get('/:id', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Obteniendo insumos de presupuesto', { 
    presupuestoId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await obtenerInsumosPresupuesto(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/presupuestos/{id}/insumos:
 *   post:
 *     tags: [Presupuestos - Items]
 *     summary: Agregar insumo a presupuesto
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
 *             required: [insumo_id, cantidad, costo, precio_facturar]
 *             properties:
 *               insumo_id:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *               costo:
 *                 type: number
 *               precio_facturar:
 *                 type: number
 *               porcentaje_aplicado:
 *                 type: number
 *     responses:
 *       201:
 *         description: Insumo agregado
 */
router.post('/:id/insumos', authenticateToken, validatePresupuestoId, validateInsumoData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { insumo_id, cantidad, costo, precio_facturar } = req.body;
  
  logger.info('Agregando insumo a presupuesto', { 
    presupuestoId: id, 
    insumoId: insumo_id, 
    cantidad, 
    costo, 
    precio_facturar,
    usuario: req.user.id 
  });
  
  const resultado = await guardarInsumoPresupuesto(req, res, () => {});
  
  logger.info('Insumo agregado exitosamente', { 
    presupuestoId: id, 
    insumoId: insumo_id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/presupuestos/{id}/insumos:
 *   delete:
 *     tags: [Presupuestos - Items]
 *     summary: Eliminar insumo de presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: insumo_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Insumo eliminado
 */
router.delete('/:id/insumos', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { id: insumoId } = req.body;
  
  if (!insumoId) {
    return res.status(400).json({ error: 'ID del insumo es requerido' });
  }
  
  logger.info('Eliminando insumo de presupuesto', { 
    presupuestoId: id, 
    insumoId, 
    usuario: req.user.id 
  });
  
  const resultado = await eliminarInsumoPresupuesto(req, res, () => {});
  
  logger.info('Insumo eliminado exitosamente', { 
    presupuestoId: id, 
    insumoId, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

// Ruta duplicada para compatibilidad
router.get('/:id/insumos', authenticateToken, validatePresupuestoId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Obteniendo insumos de presupuesto (ruta alternativa)', { 
    presupuestoId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await obtenerInsumosPresupuesto(req, res, () => {});
  return resultado;
}));

export default router;
