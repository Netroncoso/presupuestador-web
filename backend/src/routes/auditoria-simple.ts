import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticateToken } from '../middleware/auth';
import { broadcastNotificationUpdate, broadcastPresupuestoUpdate } from '../controllers/sseController';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

const router = Router();

// Middleware para verificar rol gerencias/admin
const requireAuditor = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const rolesPermitidos = ['gerencia_administrativa', 'gerencia_prestacional', 'gerencia_general', 'admin'];
  if (authReq.user?.rol && rolesPermitidos.includes(authReq.user.rol)) {
    return next();
  }
  res.status(403).json({ error: 'Acceso denegado: Solo gerencias o admins' });
};

/**
 * @swagger
 * /api/auditoria/historial/{id}:
 *   get:
 *     tags: [Auditoría Simple (Deprecado)]
 *     summary: Obtener historial de auditoría de un presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de auditoría
 */
router.get('/historial/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const version = req.query.version ? parseInt(req.query.version as string) : null;
  
  logger.info('Obteniendo historial de auditoría simple', { 
    presupuestoId: id, 
    version,
    usuario: req.user.id 
  });
  
  let query = `
    SELECT 
      a.id, a.estado_anterior, a.estado_nuevo, a.comentario, 
      a.fecha, a.version_presupuesto,
      u.username as auditor_nombre
    FROM auditorias_presupuestos a
    LEFT JOIN usuarios u ON a.auditor_id = u.id
    WHERE a.presupuesto_id = ?`;
  
  const params = [id];
  
  if (version) {
    query += ` AND a.version_presupuesto = ?`;
    params.push(version);
  }
  
  query += ` ORDER BY a.fecha DESC`;
  
  const [rows] = await pool.query(query, params);
  
  res.json(rows);
}));

/**
 * @swagger
 * /api/auditoria/pendientes:
 *   get:
 *     tags: [Auditoría Simple (Deprecado)]
 *     summary: Obtener presupuestos pendientes de auditoría
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de presupuestos pendientes
 */
router.get('/pendientes', authenticateToken, requireAuditor, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  logger.info('Obteniendo presupuestos pendientes simple', { usuario: req.user.id });
  
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
}));

/**
 * @swagger
 * /api/auditoria/pedir/{id}:
 *   put:
 *     tags: [Auditoría Simple (Deprecado)]
 *     summary: Solicitar auditoría manual
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mensaje:
 *                 type: string
 *     responses:
 *       200:
 *         description: Auditoría solicitada
 */
router.put('/pedir/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { mensaje } = req.body;
  
  logger.info('Solicitando auditoría simple', { 
    presupuestoId: id, 
    mensaje, 
    usuario: req.user.id 
  });
  
  const [presupuesto] = await pool.query(
    'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
    [id]
  );
  
  if ((presupuesto as any[]).length === 0) {
    return res.status(404).json({ error: 'Presupuesto no encontrado' });
  }
  
  const p = (presupuesto as any)[0];
  const estadoAnterior = p.estado;
  
  if (estadoAnterior === 'pendiente_administrativa') {
    // Si ya está en auditoría, actualizar el comentario del registro existente si hay mensaje
    if (mensaje && mensaje.trim()) {
      await pool.query(`
        UPDATE auditorias_presupuestos 
        SET comentario = ?
        WHERE presupuesto_id = ? AND version_presupuesto = ? AND estado_nuevo = 'pendiente_administrativa'
        ORDER BY fecha DESC LIMIT 1
      `, [mensaje.trim(), id, p.version || 1]);
      
      const mensajeActualizado = `Auditoría solicitada para presupuesto de ${p.Nombre_Apellido} - ${mensaje.trim()}`;
      
      await pool.query(`
        UPDATE notificaciones 
        SET mensaje = ?
        WHERE presupuesto_id = ? AND tipo = 'pendiente' AND usuario_id IN (
          SELECT id FROM usuarios WHERE rol = 'gerencia_administrativa' AND activo = 1
        )
      `, [mensajeActualizado, id]);
      
      broadcastPresupuestoUpdate();
    }
    
    return res.json({ success: true, estado: 'pendiente_administrativa', mensaje: 'Ya está en auditoría' });
  }
  
  // Actualizar estado
  await pool.query(
    'UPDATE presupuestos SET estado = "pendiente_administrativa" WHERE idPresupuestos = ?',
    [id]
  );
  
  // Insertar en auditorías
  await pool.query(`
    INSERT INTO auditorias_presupuestos 
    (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
    VALUES (?, ?, ?, ?, 'pendiente_administrativa', ?)
  `, [id, p.version || 1, p.usuario_id, estadoAnterior, mensaje || 'Auditoría solicitada manualmente']);
  
  // Crear notificaciones
  let mensajeNotificacion = `Auditoría solicitada para presupuesto de ${p.Nombre_Apellido}`;
  if (mensaje && mensaje.trim()) {
    mensajeNotificacion += ` - ${mensaje.trim()}`;
  }
  
  await pool.query(`
    INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
    SELECT u.id, ?, ?, 'pendiente', ?
    FROM usuarios u 
    WHERE u.rol = 'gerencia_administrativa' 
    AND u.activo = 1
  `, [id, p.version || 1, mensajeNotificacion]);
  
  broadcastPresupuestoUpdate();
  
  logger.info('Auditoría solicitada exitosamente simple', { 
    presupuestoId: id, 
    usuario: req.user.id 
  });
  
  res.json({ success: true, estado: 'pendiente_administrativa' });
}));

/**
 * @swagger
 * /api/auditoria/estado/{id}:
 *   put:
 *     tags: [Auditoría Simple (Deprecado)]
 *     summary: Cambiar estado de presupuesto
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_revision, aprobado, rechazado]
 *               comentario:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.put('/estado/:id', authenticateToken, requireAuditor, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { estado, comentario } = req.body;
  const auditor_id = req.user.id;
  
  if (!['pendiente', 'en_revision', 'aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  
  logger.info('Cambiando estado simple', { 
    presupuestoId: id, 
    estado, 
    comentario, 
    auditor: auditor_id 
  });
  
  const [presupuesto] = await pool.query(
    'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
    [id]
  );
  
  if ((presupuesto as any[]).length === 0) {
    return res.status(404).json({ error: 'Presupuesto no encontrado' });
  }
  
  const estadoAnterior = (presupuesto as any)[0].estado;
  
  await pool.query(
    'UPDATE presupuestos SET estado = ? WHERE idPresupuestos = ?',
    [estado, id]
  );
  
  await pool.query(`
    INSERT INTO auditorias_presupuestos 
    (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [id, (presupuesto as any)[0].version || 1, auditor_id, estadoAnterior, estado, comentario || null]);
  
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
    
    broadcastNotificationUpdate((presupuesto as any)[0].usuario_id);
  }
  
  broadcastPresupuestoUpdate();
  
  logger.info('Estado cambiado exitosamente simple', { 
    presupuestoId: id, 
    estado, 
    auditor: auditor_id 
  });
  
  res.json({ success: true, estado });
}));

export default router;
