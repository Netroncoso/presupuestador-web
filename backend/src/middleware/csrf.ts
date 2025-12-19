import { Request, Response, NextFunction } from 'express';

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    const origin = req.get('origin');
    const allowedOrigins = process.env.FRONTEND_URL?.split(',') || [];

    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed.trim()))) {
      return res.status(403).json({ error: 'Invalid origin' });
    }

    next();
  } catch (error) {
    console.error('CSRF protection error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
