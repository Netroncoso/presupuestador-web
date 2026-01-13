import { Request, Response } from 'express';
import { pool } from '../db';
import { logger } from '../utils/logger';
import { sendSSEEvent, sendHeartbeat } from '../middleware/sseCleanup';
import jwt from 'jsonwebtoken';
import { Notificaciones, Presupuestos } from '../types/database';
import { AuthenticatedRequest } from '../types/express';

interface SSEConnection {
  res: Response;
  userId: number;
  userRole: string;
  heartbeatTimer?: NodeJS.Timeout;
}

// Store active SSE connections
const activeConnections = new Map<number, SSEConnection[]>();

// Constants
const HEARTBEAT_INTERVAL = 30000;
const NOTIFICATION_LIMIT = 20;

export const streamUpdates = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { userId, userRole } = await authenticateUser(authReq, res);
  if (!userId || !userRole) return;

  setupSSEHeaders(res);
  await sendInitialData(res, userId, userRole);

  const connection = addConnection(userId, userRole, res);
  const heartbeat = startHeartbeat(connection);

  setupCleanupHandlers(authReq, heartbeat, userId, res);

  // Send immediate heartbeat to confirm connection
  setTimeout(() => {
    if (!sendHeartbeat(res)) {
      removeConnection(userId, res);
    }
  }, 1000);
};

const authenticateUser = async (req: Request, res: Response): Promise<{ userId?: number; userRole?: string }> => {
  const token = req.query.token as string || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    res.end();
    return {};
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;

    const userId = req.user?.id;
    const userRole = req.user?.rol;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      res.end();
      return {};
    }

    return { userId, userRole };
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    res.end();
    return {};
  }
};

const setupSSEHeaders = (res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
};

const addConnection = (userId: number, userRole: string, res: Response): SSEConnection => {
  if (!activeConnections.has(userId)) {
    activeConnections.set(userId, []);
  }

  const connection = { res, userId, userRole };
  activeConnections.get(userId)!.push(connection);

  logger.info(`SSE connection established for user ${String(userId).replace(/[\r\n]/g, '')}`);
  return connection;
};

const startHeartbeat = (connection: SSEConnection) => {
  const timer = setInterval(() => {
    if (!sendHeartbeat(connection.res)) {
      logger.info(`Heartbeat failed manually for user ${String(connection.userId).replace(/[\r\n]/g, '')}`, { userId: connection.userId });
      removeConnection(connection.userId, connection.res);
    }
  }, HEARTBEAT_INTERVAL);

  connection.heartbeatTimer = timer;
  return timer;
};

const setupCleanupHandlers = (req: Request, heartbeat: NodeJS.Timeout, userId: number, res: Response) => {
  // Nota: heartbeat argument is kept for signature compatibility but not used directly 
  // because cleanup is now centralized in removeConnection

  req.on('close', () => {
    removeConnection(userId, res);
    logger.info(`SSE client disconnected for user ${String(userId).replace(/[\r\n]/g, '')}`);
  });

  req.on('error', (err) => {
    removeConnection(userId, res);
    // Enhanced logging to debug
    if (err instanceof Error) {
      logger.error(`SSE connection error for user ${userId}. Stack: ${err.stack}`);
    } else {
      logger.error(`SSE connection error for user ${userId}:`, err);
    }
  });
};

const sendInitialData = async (res: Response, userId: number, userRole: string) => {
  try {
    const notificationData = await getNotificationData(userId);
    if (!sendEvent(res, 'notifications', notificationData)) {
      removeConnection(userId, res);
      return;
    }

    const rolesGerencia = ['gerencia_administrativa', 'gerencia_prestacional', 'gerencia_general', 'admin'];
    if (rolesGerencia.includes(userRole)) {
      const presupuestosData = await getPresupuestosData();
      if (!sendEvent(res, 'presupuestos', presupuestosData)) {
        removeConnection(userId, res);
        return;
      }
    }
  } catch (error) {
    logger.error('Error sending initial SSE data:', error);
  }
};

const getNotificationData = async (userId: number) => {
  const [countResult] = await pool.query<Notificaciones[]>(
    'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND estado = "nuevo"',
    [userId]
  );

  const [notificationsList] = await pool.query<Notificaciones[]>(`
    SELECT n.id, n.tipo, n.mensaje, n.estado, n.creado_en, n.presupuesto_id, 
           n.version_presupuesto, p.Nombre_Apellido as paciente, p.DNI as dni_paciente
    FROM notificaciones n
    LEFT JOIN presupuestos p ON n.presupuesto_id = p.idPresupuestos
    WHERE n.usuario_id = ?
    ORDER BY n.creado_en DESC
    LIMIT ?
  `, [userId, NOTIFICATION_LIMIT]);

  return {
    count: countResult[0].count,
    list: notificationsList
  };
};

const getPresupuestosData = async () => {
  const [pendientes] = await pool.query<Presupuestos[]>(`
    SELECT 
      p.idPresupuestos, p.version, p.estado, p.Nombre_Apellido, p.DNI, 
      p.sucursal_id, ps.Sucursales_mh as Sucursal, p.costo_total, p.rentabilidad, p.dificil_acceso, 
      p.created_at, u.username as creador, s.Sucursales_mh as sucursal_nombre,
      DATEDIFF(NOW(), p.created_at) as dias_pendiente
    FROM presupuestos p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID
    LEFT JOIN sucursales_mh ps ON p.sucursal_id = ps.ID
    WHERE p.estado IN (
      'pendiente_administrativa', 'en_revision_administrativa',
      'pendiente_prestacional', 'en_revision_prestacional',
      'pendiente_general', 'en_revision_general'
    ) AND p.es_ultima_version = 1
    ORDER BY p.created_at ASC
  `);

  return { pendientes };
};

const sendEvent = (res: Response, eventType: string, data: any): boolean => {
  return sendSSEEvent(res, eventType, data);
};

const removeConnection = (userId: number, res: Response) => {
  const connections = activeConnections.get(userId);
  if (!connections) return;

  const index = connections.findIndex(conn => conn.res === res);
  if (index !== -1) {
    const conn = connections[index];

    // Centralized Cleanup Strategy

    // 1. Clean timer if exists
    if (conn.heartbeatTimer) {
      clearInterval(conn.heartbeatTimer);
      // logger.debug(`Cleared heartbeat timer for user ${userId}`);
    }

    // 2. Ensure socket is closed
    if (!res.writableEnded && !res.destroyed) {
      try {
        res.end();
        // logger.debug(`Closed HTTP connection for user ${userId}`);
      } catch (e) {
        logger.error(`Error closing response for user ${userId}`, e);
      }
    }

    // 3. Remove from map
    connections.splice(index, 1);

    if (connections.length === 0) {
      activeConnections.delete(userId);
    }

    logger.info(`Connection fully cleaned for user ${String(userId).replace(/[\r\n]/g, '')}`);
  }
};

// Broadcast functions to be called from other controllers
export const broadcastNotificationUpdate = async (userId: number) => {
  const connections = activeConnections.get(userId);
  if (!connections?.length) return;

  try {
    const notificationData = await getNotificationData(userId);
    broadcastToConnections(connections, 'notifications', notificationData, userId);
  } catch (error) {
    logger.error('Error broadcasting notification update:', error);
  }
};

export const broadcastPresupuestoUpdate = async () => {
  const auditorConnections = getAuditorConnections();
  if (!auditorConnections.length) return;

  try {
    const presupuestosData = await getPresupuestosData();
    auditorConnections.forEach(conn => {
      if (!sendEvent(conn.res, 'presupuestos', presupuestosData)) {
        removeConnection(conn.userId, conn.res);
      }
    });
  } catch (error) {
    logger.error('Error broadcasting presupuesto update:', error);
  }
};

const getAuditorConnections = (): SSEConnection[] => {
  const auditorConnections: SSEConnection[] = [];
  const rolesGerencia = ['gerencia_administrativa', 'gerencia_prestacional', 'gerencia_general', 'admin'];
  activeConnections.forEach(connections => {
    connections.forEach(conn => {
      if (rolesGerencia.includes(conn.userRole)) {
        auditorConnections.push(conn);
      }
    });
  });
  return auditorConnections;
};

const broadcastToConnections = (connections: SSEConnection[], eventType: string, data: any, userId: number) => {
  connections.forEach(conn => {
    if (!sendEvent(conn.res, eventType, data)) {
      removeConnection(userId, conn.res);
    }
  });
};