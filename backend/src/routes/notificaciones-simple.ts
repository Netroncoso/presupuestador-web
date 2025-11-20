import { Router } from 'express';
import { pool } from '../db';
import { auth } from '../middleware/auth';

const router = Router();

// Obtener notificaciones del usuario
router.get('/', auth, async (req: any, res) => {
  const usuario_id = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo notificaciones' });
  }
});

// Obtener contador de notificaciones no leídas
router.get('/count', auth, async (req: any, res) => {
  const usuario_id = req.user?.id;
  
  try {
    const [result] = await pool.query(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
      [usuario_id]
    );
    
    res.json({ count: (result as any)[0].count });
  } catch (error) {
    res.json({ count: 0 });
  }
});

// Marcar notificación como leída
router.put('/:id/leer', auth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const usuario_id = req.user?.id;
  
  try {
    await pool.query(
      'UPDATE notificaciones SET estado = "leido" WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );
    
    // Broadcast actualización a todas las conexiones del usuario
    const { broadcastNotificationUpdate } = require('../controllers/sseController');
    await broadcastNotificationUpdate(usuario_id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error marcando notificación' });
  }
});

// Marcar todas como leídas
router.put('/leer-todas', auth, async (req: any, res) => {
  const usuario_id = req.user?.id;
  
  try {
    await pool.query(
      'UPDATE notificaciones SET estado = "leido" WHERE usuario_id = ? AND estado = "nuevo"',
      [usuario_id]
    );
    
    // Broadcast actualización a todas las conexiones del usuario
    const { broadcastNotificationUpdate } = require('../controllers/sseController');
    await broadcastNotificationUpdate(usuario_id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error marcando notificaciones' });
  }
});

export default router;