import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as notificacionesController from '../controllers/notificacionesController';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateNotificacionId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'ID de notificación debe ser un número válido' });
  }
  next();
};

const validatePaginationParams = (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  
  if (page < 1) {
    return res.status(400).json({ error: 'Página debe ser mayor a 0' });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Límite debe estar entre 1 y 100' });
  }
  
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  next();
};

const router = Router();

/**
 * @swagger
 * /api/notificaciones:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Obtener notificaciones del usuario
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/', authenticateToken, validatePaginationParams, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { page, limit } = req.query;
  
  logger.info('Obteniendo notificaciones', { 
    usuario: req.user.id, 
    page: parseInt(page as string), 
    limit: parseInt(limit as string) 
  });
  
  const resultado = await notificacionesController.obtenerNotificaciones(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/notificaciones/count:
 *   get:
 *     tags: [Notificaciones]
 *     summary: Contar notificaciones no leídas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contador de no leídas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 */
router.get('/count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Contando notificaciones no leídas', { usuario: req.user.id });
  
  const resultado = await notificacionesController.contarNoLeidas(req, res, () => {});
  return resultado;
}));

/**
 * @swagger
 * /api/notificaciones/{id}/leer:
 *   put:
 *     tags: [Notificaciones]
 *     summary: Marcar notificación como leída
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
 *         description: Notificación marcada
 */
router.put('/:id/leer', authenticateToken, validateNotificacionId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  
  logger.info('Marcando notificación como leída', { 
    notificacionId: id, 
    usuario: req.user.id 
  });
  
  const resultado = await notificacionesController.marcarComoLeida(req, res, () => {});
  
  logger.info('Notificación marcada como leída exitosamente', { 
    notificacionId: id, 
    usuario: req.user.id 
  });
  
  return resultado;
}));

/**
 * @swagger
 * /api/notificaciones/leer-todas:
 *   put:
 *     tags: [Notificaciones]
 *     summary: Marcar todas las notificaciones como leídas
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas marcadas como leídas
 */
router.put('/leer-todas', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Marcando todas las notificaciones como leídas', { usuario: req.user.id });
  
  const resultado = await notificacionesController.marcarTodasLeidas(req, res, () => {});
  
  logger.info('Todas las notificaciones marcadas como leídas exitosamente', { 
    usuario: req.user.id 
  });
  
  return resultado;
}));

export default router;
