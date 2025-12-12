import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new AppError(401, 'Token no proporcionado');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      next(new AppError(401, 'Token inválido'));
    }
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'admin') {
    return next(new AppError(403, 'Acceso denegado. Se requiere rol de administrador'));
  }
  next();
};

export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'admin' || req.user?.username !== 'admin') {
    return next(new AppError(403, 'Acceso denegado. Se requiere ser el administrador principal'));
  }
  next();
};

// Middlewares para gerencias
export const requireGerenciaAdministrativa = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'gerencia_administrativa' && req.user?.rol !== 'admin') {
    return next(new AppError(403, 'Acceso denegado. Se requiere rol de Gerencia Administrativa'));
  }
  next();
};

export const requireGerenciaPrestacional = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'gerencia_prestacional' && req.user?.rol !== 'admin') {
    return next(new AppError(403, 'Acceso denegado. Se requiere rol de Gerencia Prestacional'));
  }
  next();
};

export const requireGerenciaGeneral = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'gerencia_general' && req.user?.rol !== 'admin') {
    return next(new AppError(403, 'Acceso denegado. Se requiere rol de Gerencia General'));
  }
  next();
};

export const requireAnyGerencia = (req: AuthRequest, res: Response, next: NextFunction) => {
  const gerencias = ['gerencia_administrativa', 'gerencia_prestacional', 'gerencia_financiera', 'gerencia_general', 'admin'];
  if (!gerencias.includes(req.user?.rol)) {
    return next(new AppError(403, 'Acceso denegado. Se requiere rol de gerencia'));
  }
  next();
};

// Alias para compatibilidad
export const auth = authenticateToken;