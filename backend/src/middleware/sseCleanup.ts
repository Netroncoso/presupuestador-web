import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Middleware to handle SSE connection cleanup
export const sseCleanup = (req: Request, res: Response, next: NextFunction) => {
  // Set up proper SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

  // Handle client disconnect
  req.on('close', () => {
    logger.info('SSE client disconnected');
  });

  req.on('error', (err) => {
    logger.error('SSE request error:', err);
  });

  res.on('error', (err) => {
    logger.error('SSE response error:', err);
  });

  next();
};

// Utility function to send SSE events safely
export const sendSSEEvent = (res: Response, eventType: string, data: any): boolean => {
  try {
    if (res.destroyed || res.writableEnded) {
      return false;
    }
    
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch (error) {
    logger.error('Error sending SSE event:', error);
    return false;
  }
};

// Utility function to send heartbeat
export const sendHeartbeat = (res: Response): boolean => {
  try {
    if (res.destroyed || res.writableEnded) {
      return false;
    }
    
    res.write(': heartbeat\n\n');
    return true;
  } catch (error) {
    logger.error('Error sending heartbeat:', error);
    return false;
  }
};