import { Router, Request, Response } from 'express';
import { cacheService } from '../services/cacheService';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

/**
 * @swagger
 * /api/cache:
 *   get:
 *     tags: [Sistema - Cache]
 *     summary: Obtener estadísticas de cache
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de cache
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keys:
 *                   type: integer
 *                 hits:
 *                   type: integer
 *                 misses:
 *                   type: integer
 *                 hitRate:
 *                   type: string
 *                 ksize:
 *                   type: integer
 *                 vsize:
 *                   type: integer
 */
router.get('/', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo estadísticas de cache', { usuario: req.user.id });
  
  const stats = cacheService.getStats();
  const hitRate = stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) : '0';
  
  const cacheData = {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: hitRate + '%',
    ksize: stats.ksize,
    vsize: stats.vsize
  };
  
  res.json(cacheData);
}));

/**
 * @swagger
 * /api/cache/flush:
 *   post:
 *     tags: [Sistema - Cache]
 *     summary: Limpiar cache completo
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache limpiado
 */
router.post('/flush', authenticateToken, requireAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Limpiando cache completo', { usuario: req.user.id });
  
  cacheService.flush();
  
  logger.info('Cache limpiado exitosamente', { usuario: req.user.id });
  
  res.json({ success: true, message: 'Cache flushed' });
}));

export default router;
