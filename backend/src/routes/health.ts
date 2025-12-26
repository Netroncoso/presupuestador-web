import { Router } from 'express';
import { pool } from '../db';
import { cacheService } from '../services/cacheService';

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Sistema - Health]
 *     summary: Health check del sistema
 *     description: Verifica estado de base de datos y cache
 *     responses:
 *       200:
 *         description: Sistema operativo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                     cache:
 *                       type: string
 *       503:
 *         description: Error en servicios
 */
router.get('/', async (req, res) => {
  try {
    const [dbCheck] = await pool.query('SELECT 1');
    const cacheStats = cacheService.getStats();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        cache: 'active'
      },
      cache: {
        keys: cacheStats.keys,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hits > 0 ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%' : '0%'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
