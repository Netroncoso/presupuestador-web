import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import * as alertasEquipamientosController from '../controllers/alertasEquipamientosController';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateTipoEquipamientoId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de tipo de equipamiento debe ser un número válido' });
  }
  next();
};

const validateAlertaEquipamiento = (req: Request, res: Response, next: NextFunction) => {
  const { cantidad_maxima, color_alerta, activo_alerta } = req.body;
  
  if (cantidad_maxima !== undefined && (isNaN(parseInt(cantidad_maxima)) || parseInt(cantidad_maxima) < 0)) {
    return res.status(400).json({ error: 'Cantidad máxima debe ser un número positivo' });
  }
  
  if (color_alerta && !['orange', 'red', 'yellow'].includes(color_alerta)) {
    return res.status(400).json({ error: 'Color de alerta debe ser orange, red o yellow' });
  }
  
  if (activo_alerta !== undefined && typeof activo_alerta !== 'boolean') {
    return res.status(400).json({ error: 'Activo alerta debe ser boolean' });
  }
  
  next();
};

const router = Router();

/**
 * @swagger
 * /api/alertas-equipamientos:
 *   get:
 *     summary: Obtener alertas de equipamientos (Admin)
 *     description: Lista configuración de alertas por tipo de equipamiento
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas de equipamientos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   nombre:
 *                     type: string
 *                     description: Tipo de equipamiento
 *                   cantidad_maxima:
 *                     type: integer
 *                     nullable: true
 *                   mensaje_alerta:
 *                     type: string
 *                     nullable: true
 *                   color_alerta:
 *                     type: string
 *                   activo_alerta:
 *                     type: boolean
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo alertas de equipamientos', { usuario: req.user.id });
  const resultado = await alertasEquipamientosController.obtenerAlertasEquipamientos(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/alertas-equipamientos/{id}:
 *   put:
 *     summary: Actualizar alerta de equipamiento (Admin)
 *     description: Actualiza configuración de alerta para un tipo de equipamiento
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del tipo de equipamiento
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cantidad_maxima:
 *                 type: integer
 *                 example: 5
 *               mensaje_alerta:
 *                 type: string
 *                 example: "Alto consumo de oxígeno - Paciente complejo"
 *               color_alerta:
 *                 type: string
 *                 enum: [orange, red, yellow]
 *                 example: "orange"
 *               activo_alerta:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Alerta actualizada
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.put('/:id', authenticateToken, requireAdmin, validateTipoEquipamientoId, validateAlertaEquipamiento, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta } = req.body;
  
  logger.info('Actualizando alerta de equipamiento', { 
    tipoId: id, 
    cantidad_maxima, 
    mensaje_alerta, 
    color_alerta, 
    activo_alerta, 
    usuario: req.user.id 
  });
  
  const resultado = await alertasEquipamientosController.actualizarAlertaEquipamiento(req, res, () => {});
  
  logger.info('Alerta de equipamiento actualizada exitosamente', { 
    tipoId: id, 
    cantidad_maxima, 
    color_alerta, 
    activo_alerta, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
