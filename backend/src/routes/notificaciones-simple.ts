import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
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

// Obtener notificaciones del usuario
router.get('/', authenticateToken, validatePaginationParams, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const usuario_id = req.user.id;
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);
  const offset = (page - 1) * limit;
  
  logger.info('Obteniendo notificaciones simple', { 
    usuario: usuario_id, 
    page, 
    limit 
  });
  
  const [notificaciones] = await pool.query(`
    SELECT 
      n.id, n.tipo, n.mensaje, n.estado, n.creado_en,
      n.presupuesto_id, n.version_presupuesto,
      p.Nombre_Apellido as paciente, p.DNI as dni_paciente,
      a.comentario
    FROM notificaciones n
    JOIN presupuestos p ON n.presupuesto_id = p.idPresupuestos
    LEFT JOIN auditorias_presupuestos a ON n.presupuesto_id = a.presupuesto_id 
      AND n.version_presupuesto = a.version_presupuesto
      AND n.tipo IN ('aprobado', 'rechazado')
    WHERE n.usuario_id = ?
    ORDER BY n.creado_en DESC
    LIMIT ? OFFSET ?
  `, [usuario_id, limit, offset]);
  
  res.json(notificaciones);
}));

// Obtener contador de notificaciones no leídas
router.get('/count', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const usuario_id = req.user.id;
  
  logger.info('Contando notificaciones no leídas simple', { usuario: usuario_id });
  
  const [result] = await pool.query(
    'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
    [usuario_id]
  );
  
  res.json({ count: (result as any)[0].count });
}));

// Marcar notificación como leída
router.put('/:id/leer', authenticateToken, validateNotificacionId, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const usuario_id = req.user.id;
  
  logger.info('Marcando notificación como leída simple', { 
    notificacionId: id, 
    usuario: usuario_id 
  });
  
  await pool.query(
    'UPDATE notificaciones SET estado = "leido" WHERE id = ? AND usuario_id = ?',
    [id, usuario_id]
  );
  
  // Broadcast actualización a todas las conexiones del usuario
  const { broadcastNotificationUpdate } = require('../controllers/sseController');
  await broadcastNotificationUpdate(usuario_id);
  
  logger.info('Notificación marcada como leída exitosamente simple', { 
    notificacionId: id, 
    usuario: usuario_id 
  });
  
  res.json({ success: true });
}));

// Marcar todas como leídas
router.put('/leer-todas', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const usuario_id = req.user.id;
  
  logger.info('Marcando todas las notificaciones como leídas simple', { usuario: usuario_id });
  
  await pool.query(
    'UPDATE notificaciones SET estado = "leido" WHERE usuario_id = ? AND estado = "nuevo"',
    [usuario_id]
  );
  
  // Broadcast actualización a todas las conexiones del usuario
  const { broadcastNotificationUpdate } = require('../controllers/sseController');
  await broadcastNotificationUpdate(usuario_id);
  
  logger.info('Todas las notificaciones marcadas como leídas exitosamente simple', { 
    usuario: usuario_id 
  });
  
  res.json({ success: true });
}));

export default router;