import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { broadcastNotificationUpdate } from '../controllers/sseController';
import { Notificaciones, MutationResult } from '../types/database';

export class NotificacionesService {
  
  async obtener(usuarioId: number, filtros: {
    page?: number;
    limit?: number;
    estado?: string;
    paciente?: string;
    presupuesto_id?: string;
  }) {
    const page = filtros.page || 1;
    const limit = filtros.limit || 10;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE n.usuario_id = ?';
    const params: any[] = [usuarioId];
    
    if (filtros.estado) {
      whereClause += ' AND n.estado = ?';
      params.push(filtros.estado);
    }
    
    if (filtros.paciente) {
      whereClause += ' AND p.Nombre_Apellido LIKE ?';
      params.push(`%${filtros.paciente}%`);
    }
    
    if (filtros.presupuesto_id) {
      whereClause += ' AND n.presupuesto_id = ?';
      params.push(parseInt(filtros.presupuesto_id));
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
    
    return notificaciones;
  }

  async marcarComoLeida(id: number, usuarioId: number) {
    const [result] = await pool.query<MutationResult>(
      'UPDATE notificaciones SET estado = "leido" WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );
    
    if (result.affectedRows === 0) {
      throw new AppError(404, 'Notificación no encontrada');
    }
    
    // Broadcast update to user
    broadcastNotificationUpdate(usuarioId);
    
    return { success: true };
  }

  async contarNoLeidas(usuarioId: number) {
    const [result] = await pool.query<Notificaciones[]>(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
      [usuarioId]
    );
    
    return { count: result[0].count };
  }

  async marcarTodasLeidas(usuarioId: number) {
    await pool.query(
      'UPDATE notificaciones SET estado = "leido" WHERE usuario_id = ? AND estado = "nuevo"',
      [usuarioId]
    );
    
    // Broadcast update to user
    broadcastNotificationUpdate(usuarioId);
    
    return { success: true };
  }
}

export const notificacionesService = new NotificacionesService();