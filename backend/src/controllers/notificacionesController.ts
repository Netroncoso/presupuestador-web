import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { broadcastNotificationUpdate } from './sseController';
import { Notificaciones, MutationResult } from '../types/database';

// Obtener notificaciones del usuario
export const obtenerNotificaciones = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const usuario_id = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  // Filtros
  const estado = req.query.estado as string; // 'nuevo', 'leido'
  const paciente = req.query.paciente as string;
  const presupuesto_id = req.query.presupuesto_id as string;
  
  let whereClause = 'WHERE n.usuario_id = ?';
  const params: any[] = [usuario_id];
  
  if (estado) {
    whereClause += ' AND n.estado = ?';
    params.push(estado);
  }
  
  if (paciente) {
    whereClause += ' AND p.Nombre_Apellido LIKE ?';
    params.push(`%${paciente}%`);
  }
  
  if (presupuesto_id) {
    whereClause += ' AND n.presupuesto_id = ?';
    params.push(parseInt(presupuesto_id));
  }
  
  params.push(limit, offset);
  
  const [notificaciones] = await pool.query<Notificaciones[]>(`
    SELECT 
      n.id, n.tipo, n.mensaje, n.estado, n.creado_en,
      n.presupuesto_id, n.version_presupuesto,
      COALESCE(p.Nombre_Apellido, 'Paciente no encontrado') as paciente, 
      COALESCE(p.DNI, 'N/A') as dni_paciente
    FROM notificaciones n
    LEFT JOIN presupuestos p ON n.presupuesto_id = p.idPresupuestos
    ${whereClause}
    ORDER BY n.creado_en DESC
    LIMIT ? OFFSET ?
  `, params);
  
  res.json(notificaciones);
});

// Marcar notificación como leída
export const marcarComoLeida = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const usuario_id = req.user?.id;
  
  const [result] = await pool.query<MutationResult>(
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
  
  const [result] = await pool.query<Notificaciones[]>(
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