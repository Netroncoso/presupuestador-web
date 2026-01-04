import { Router, Request, Response, NextFunction } from 'express';
import { obtenerAlertasServicios, actualizarAlertaServicio, crearAlertaServicio } from '../controllers/alertasServiciosController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateAlertaId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de alerta debe ser un número válido' });
  }
  next();
};

const validateAlertaServicioData = (req: Request, res: Response, next: NextFunction) => {
  const { tipo_unidad, cantidad_maxima, mensaje_alerta } = req.body;
  
  if (!tipo_unidad?.trim()) {
    return res.status(400).json({ error: 'Tipo de unidad es requerido' });
  }
  
  if (!cantidad_maxima || isNaN(parseInt(cantidad_maxima)) || parseInt(cantidad_maxima) <= 0) {
    return res.status(400).json({ error: 'Cantidad máxima debe ser un número positivo' });
  }
  
  if (!mensaje_alerta?.trim()) {
    return res.status(400).json({ error: 'Mensaje de alerta es requerido' });
  }
  
  next();
};

const validateAlertaServicioUpdate = (req: Request, res: Response, next: NextFunction) => {
  const { cantidad_maxima, color_alerta, activo } = req.body;
  
  if (cantidad_maxima !== undefined && (isNaN(parseInt(cantidad_maxima)) || parseInt(cantidad_maxima) <= 0)) {
    return res.status(400).json({ error: 'Cantidad máxima debe ser un número positivo' });
  }
  
  if (color_alerta && !['orange', 'red', 'yellow'].includes(color_alerta)) {
    return res.status(400).json({ error: 'Color de alerta debe ser orange, red o yellow' });
  }
  
  if (activo !== undefined && typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'Activo debe ser boolean' });
  }
  
  next();
};

const router = Router();

/**
 * @swagger
 * /api/alertas-servicios:
 *   get:
 *     summary: Obtener alertas de servicios
 *     description: Lista configuración de alertas por tipo de unidad (horas, sesiones, días, etc.)
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de alertas configuradas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   tipo_unidad:
 *                     type: string
 *                   cantidad_maxima:
 *                     type: integer
 *                   mensaje_alerta:
 *                     type: string
 *                   color_alerta:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *   post:
 *     summary: Crear alerta de servicio (Admin)
 *     tags: [Alertas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tipo_unidad
 *               - cantidad_maxima
 *               - mensaje_alerta
 *             properties:
 *               tipo_unidad:
 *                 type: string
 *                 example: "horas"
 *               cantidad_maxima:
 *                 type: integer
 *                 example: 24
 *               mensaje_alerta:
 *                 type: string
 *                 example: "Cantidad elevada de horas - Verificar necesidad"
 *               color_alerta:
 *                 type: string
 *                 enum: [orange, red, yellow]
 *                 example: "orange"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Alerta creada
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo alertas de servicios', { usuario: req.user.id });
  const resultado = await obtenerAlertasServicios(req, res, () => {});
  return resultado;
}));

router.post('/', authenticateToken, requireAdmin, validateAlertaServicioData, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo } = req.body;
  
  logger.info('Creando alerta de servicio', { 
    tipo_unidad, 
    cantidad_maxima, 
    mensaje_alerta, 
    color_alerta, 
    activo, 
    usuario: req.user.id 
  });
  
  const resultado = await crearAlertaServicio(req, res, () => {});
  
  logger.info('Alerta de servicio creada exitosamente', { 
    tipo_unidad, 
    cantidad_maxima, 
    mensaje_alerta, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/alertas-servicios/{id}:
 *   put:
 *     summary: Actualizar alerta de servicio (Admin)
 *     tags: [Alertas]
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
 *             properties:
 *               cantidad_maxima:
 *                 type: integer
 *               mensaje_alerta:
 *                 type: string
 *               color_alerta:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Alerta actualizada
 *       403:
 *         description: Acceso denegado - Solo admin
 */
router.put('/:id', authenticateToken, requireAdmin, validateAlertaId, validateAlertaServicioUpdate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { cantidad_maxima, mensaje_alerta, color_alerta, activo } = req.body;
  
  logger.info('Actualizando alerta de servicio', { 
    alertaId: id, 
    cantidad_maxima, 
    mensaje_alerta, 
    color_alerta, 
    activo, 
    usuario: req.user.id 
  });
  
  const resultado = await actualizarAlertaServicio(req, res, () => {});
  
  logger.info('Alerta de servicio actualizada exitosamente', { 
    alertaId: id, 
    cantidad_maxima, 
    color_alerta, 
    activo, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
