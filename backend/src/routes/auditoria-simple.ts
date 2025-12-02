import { Router } from 'express';
import { pool } from '../db';
import { auth } from '../middleware/auth';
import { broadcastNotificationUpdate, broadcastPresupuestoUpdate } from '../controllers/sseController';

const router = Router();

// Middleware para verificar rol auditor/admin
const requireAuditor = (req: any, res: any, next: any) => {
  if (!['auditor_medico', 'admin'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado: Solo auditores o admins' });
  }
  next();
};

// Obtener presupuestos pendientes
router.get('/pendientes', auth, requireAuditor, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.idPresupuestos, p.version, p.estado,
        p.Nombre_Apellido, p.DNI, p.sucursal_id, ps.Sucursales_mh as Sucursal, p.idobra_social,
        p.costo_total, p.rentabilidad, p.dificil_acceso,
        p.created_at, u.username as creador, s.Sucursales_mh as sucursal_nombre,
        DATEDIFF(NOW(), p.created_at) as dias_pendiente
      FROM presupuestos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID
      LEFT JOIN sucursales_mh ps ON p.sucursal_id = ps.ID
      WHERE p.estado IN ('pendiente', 'en_revision') 
      AND p.es_ultima_version = 1
      ORDER BY p.created_at ASC
    `);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pendientes' });
  }
});

// Pedir auditoría manual
router.put('/pedir/:id', auth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const { mensaje } = req.body;
  
  try {
    // Cambiar estado a pendiente
    const [result] = await pool.query(
      'UPDATE presupuestos SET estado = "pendiente" WHERE idPresupuestos = ? AND es_ultima_version = 1',
      [id]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    
    // Obtener datos del presupuesto para notificar
    const [presupuesto] = await pool.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if ((presupuesto as any[]).length > 0) {
      const p = (presupuesto as any)[0];
      
      // Crear mensaje personalizado
      let mensajeNotificacion = `Auditoría solicitada para presupuesto de ${p.Nombre_Apellido}`;
      if (mensaje && mensaje.trim()) {
        mensajeNotificacion += ` - ${mensaje.trim()}`;
      }
      
      // Notificar auditores
      await pool.query(`
        INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'pendiente', ?
        FROM usuarios u WHERE u.rol = 'auditor_medico'
      `, [id, p.version || 1, mensajeNotificacion]);
      
      // Broadcast to auditors
      broadcastPresupuestoUpdate();
    }
    
    res.json({ success: true, estado: 'pendiente' });
  } catch (error) {
    res.status(500).json({ error: 'Error solicitando auditoría' });
  }
});

// Cambiar estado
router.put('/estado/:id', auth, requireAuditor, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const { estado, comentario } = req.body;
  const auditor_id = req.user?.id;
  
  if (!['pendiente', 'en_revision', 'aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  
  try {
    // Obtener presupuesto actual
    const [presupuesto] = await pool.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
      [id]
    );
    
    if ((presupuesto as any[]).length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    
    const estadoAnterior = (presupuesto as any)[0].estado;
    
    // Actualizar estado
    await pool.query(
      'UPDATE presupuestos SET estado = ? WHERE idPresupuestos = ?',
      [estado, id]
    );
    
    // Registrar auditoría
    await pool.query(`
      INSERT INTO auditorias_presupuestos 
      (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, (presupuesto as any)[0].version || 1, auditor_id, estadoAnterior, estado, comentario || null]);
    
    // Notificar al usuario creador
    if (['aprobado', 'rechazado'].includes(estado)) {
      await pool.query(`
        INSERT IGNORE INTO notificaciones 
        (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        VALUES (?, ?, ?, ?, ?)
      `, [
        (presupuesto as any)[0].usuario_id, 
        id, 
        (presupuesto as any)[0].version || 1, 
        estado, 
        `Presupuesto ${estado.toUpperCase()} por auditor`
      ]);
      
      // Broadcast to user
      broadcastNotificationUpdate((presupuesto as any)[0].usuario_id);
    }
    
    // Broadcast presupuesto update to auditors
    broadcastPresupuestoUpdate();
    
    res.json({ success: true, estado });
    
  } catch (error) {
    res.status(500).json({ error: 'Error cambiando estado' });
  }
});

export default router;