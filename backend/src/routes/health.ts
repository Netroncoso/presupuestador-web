import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { cacheService } from '../services/cacheService';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';

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
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Health check solicitado', { ip: req.ip });
  
  const [dbCheck] = await pool.query('SELECT 1');
  const cacheStats = cacheService.getStats();
  
  const healthData = {
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
  };
  
  logger.info('Health check exitoso', { 
    database: 'connected', 
    cache: 'active',
    ip: req.ip 
  });
  
  res.json(healthData);
}));

export default router;
