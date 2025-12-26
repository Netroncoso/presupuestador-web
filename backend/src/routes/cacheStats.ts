import { Router } from 'express';
import { cacheService } from '../services/cacheService';
import { authenticateToken, requireAdmin } from '../middleware/auth';

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
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  const stats = cacheService.getStats();
  const hitRate = stats.hits > 0 ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(2) : '0';
  
  res.json({
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: hitRate + '%',
    ksize: stats.ksize,
    vsize: stats.vsize
  });
});

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
router.post('/flush', authenticateToken, requireAdmin, (req, res) => {
  cacheService.flush();
  res.json({ success: true, message: 'Cache flushed' });
});

export default router;
