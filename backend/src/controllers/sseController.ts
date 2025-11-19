import { Request, Response } from 'express';
import { pool } from '../db';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

interface SSEConnection {
  res: Response;
  userId: number;
  userRole: string;
}

// Store active SSE connections
const activeConnections = new Map<number, SSEConnection[]>();

export const streamUpdates = async (req: Request & { user?: any }, res: Response) => {
  // Handle token from query parameter (EventSource doesn't support headers)
  const token = req.query.token as string || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = req.user?.id;
  const userRole = req.user?.rol;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial data
  await sendInitialData(res, userId, userRole);

  // Store connection
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, []);
  }
  activeConnections.get(userId)!.push({ res, userId, userRole });

  logger.info(`SSE connection established for user ${userId}`);

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    removeConnection(userId, res);
    logger.info(`SSE connection closed for user ${userId}`);
  });

  req.on('error', (err) => {
    clearInterval(heartbeat);
    removeConnection(userId, res);
    logger.error(`SSE connection error for user ${userId}:`, err);
  });
};

const sendInitialData = async (res: Response, userId: number, userRole: string) => {
  try {
    // Send notification count
    const [notificationResult] = await pool.query<any[]>(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
      [userId]
    );
    sendEvent(res, 'notifications', { count: notificationResult[0].count });

    // Send pending presupuestos for auditors
    if (userRole === 'auditor_medico') {
      const [pendientes] = await pool.query<any[]>(`
        SELECT 
          p.idPresupuestos, p.version, p.estado, p.Nombre_Apellido, p.DNI, 
          p.Sucursal, p.costo_total, p.rentabilidad, p.dificil_acceso, 
          p.created_at, u.username as creador, s.Sucursales_mh as sucursal_nombre,
          DATEDIFF(NOW(), p.created_at) as dias_pendiente
        FROM presupuestos p
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN sucursales s ON u.sucursal_id = s.ID
        WHERE p.estado IN ('pendiente', 'en_revision')
        ORDER BY p.created_at ASC
      `);
      sendEvent(res, 'presupuestos', { pendientes });
    }
  } catch (error) {
    logger.error('Error sending initial SSE data:', error);
  }
};

const sendEvent = (res: Response, eventType: string, data: any) => {
  res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
};

const removeConnection = (userId: number, res: Response) => {
  const connections = activeConnections.get(userId);
  if (connections) {
    const index = connections.findIndex(conn => conn.res === res);
    if (index !== -1) {
      connections.splice(index, 1);
    }
    if (connections.length === 0) {
      activeConnections.delete(userId);
    }
  }
};

// Broadcast functions to be called from other controllers
export const broadcastNotificationUpdate = async (userId: number) => {
  const connections = activeConnections.get(userId);
  if (!connections) return;

  try {
    const [result] = await pool.query<any[]>(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
      [userId]
    );

    connections.forEach(conn => {
      sendEvent(conn.res, 'notifications', { count: result[0].count });
    });
  } catch (error) {
    logger.error('Error broadcasting notification update:', error);
  }
};

export const broadcastPresupuestoUpdate = async () => {
  // Get all auditor connections
  const auditorConnections: SSEConnection[] = [];
  activeConnections.forEach(connections => {
    connections.forEach(conn => {
      if (conn.userRole === 'auditor_medico') {
        auditorConnections.push(conn);
      }
    });
  });

  if (auditorConnections.length === 0) return;

  try {
    const [pendientes] = await pool.query<any[]>(`
      SELECT 
        p.idPresupuestos, p.version, p.estado, p.Nombre_Apellido, p.DNI, 
        p.Sucursal, p.costo_total, p.rentabilidad, p.dificil_acceso, 
        p.created_at, u.username as creador, s.Sucursales_mh as sucursal_nombre,
        DATEDIFF(NOW(), p.created_at) as dias_pendiente
      FROM presupuestos p
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN sucursales s ON u.sucursal_id = s.ID
      WHERE p.estado IN ('pendiente', 'en_revision')
      ORDER BY p.created_at ASC
    `);

    auditorConnections.forEach(conn => {
      sendEvent(conn.res, 'presupuestos', { pendientes });
    });
  } catch (error) {
    logger.error('Error broadcasting presupuesto update:', error);
  }
};