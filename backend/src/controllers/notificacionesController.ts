import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { broadcastNotificationUpdate } from './sseController';

// Obtener notificaciones del usuario
export const obtenerNotificaciones = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const usuario_id = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  const [notificaciones] = await pool.query<any[]>(`
    SELECT 
      n.id, n.tipo, n.mensaje, n.estado, n.creado_en,
      n.presupuesto_id, n.version_presupuesto,
      p.Nombre_Apellido as paciente, p.DNI as dni_paciente
    FROM notificaciones n
    JOIN presupuestos p ON n.presupuesto_id = p.idPresupuestos 
      AND n.version_presupuesto = p.version
    WHERE n.usuario_id = ?
    ORDER BY n.creado_en DESC
    LIMIT ? OFFSET ?
  `, [usuario_id, limit, offset]);
  
  res.json(notificaciones);
});

// Marcar notificación como leída
export const marcarComoLeida = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const usuario_id = req.user?.id;
  
  const [result] = await pool.query<any>(
    'UPDATE notificaciones SET estado = "leido" WHERE id = ? AND usuario_id = ?',
    [id, usuario_id]
  );
  
  if (result.affectedRows === 0) {
    throw new AppError(404, 'Notificación no encontrada');
  }
  
  // Broadcast update to user
  broadcastNotificationUpdate(usuario_id);
  
  res.json({ success: true });
});

// Obtener contador de notificaciones no leídas
export const contarNoLeidas = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const usuario_id = req.user?.id;
  
  const [result] = await pool.query<any[]>(
    'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
    [usuario_id]
  );
  
  res.json({ count: result[0].count });
});

// Marcar todas como leídas
export const marcarTodasLeidas = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const usuario_id = req.user?.id;
  
  await pool.query(
    'UPDATE notificaciones SET estado = "leido" WHERE usuario_id = ? AND estado = "nuevo"',
    [usuario_id]
  );
  
  // Broadcast update to user
  broadcastNotificationUpdate(usuario_id);
  
  res.json({ success: true });
});