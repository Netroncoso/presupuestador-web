import { Router, Request, Response, NextFunction } from 'express';
import { streamUpdates } from '../controllers/sseController';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';
import jwt from 'jsonwebtoken';

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validateSSEToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string;
  
  if (!token) {
    logger.warn('SSE: Token no proporcionado', { ip: req.ip });
    return res.status(401).json({ error: 'Token requerido para SSE' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    (req as AuthenticatedRequest).user = decoded;
    
    logger.info('SSE: Token validado exitosamente', { 
      usuario: decoded.id, 
      rol: decoded.rol 
    });
    
    next();
  } catch (error) {
    logger.warn('SSE: Token inválido', { 
      token: token.substring(0, 20) + '...', 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
    return res.status(403).json({ error: 'Token inválido' });
  }
};

const router = Router();

/**
 * @swagger
 * /api/stream/updates:
 *   get:
 *     tags: [Sistema - SSE]
 *     summary: Stream de actualizaciones en tiempo real (SSE)
 *     description: Conexión Server-Sent Events para notificaciones y actualizaciones
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT token para autenticación
 *     responses:
 *       200:
 *         description: Stream SSE activo
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       401:
 *         description: Token no proporcionado
 *       403:
 *         description: Token inválido
 */
router.get('/updates', validateSSEToken, (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  
  logger.info('SSE: Nueva conexión establecida', { 
    usuario: authReq.user.id, 
    rol: authReq.user.rol,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Llamar al controller
  streamUpdates(req, res);
});

export default router;