import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const resultado = await authService.login(username, password);
  res.json(resultado);
};

export const verifyToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const resultado = await authService.verifyToken(token!);
    res.json(resultado);
  } catch (error: any) {
    // Si el token expiró, devolver 401 en lugar de 500
    if (error.name === 'TokenExpiredError' || error.message?.includes('expired')) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    throw error;
  }
};
