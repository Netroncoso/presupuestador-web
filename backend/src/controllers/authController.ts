import { Request, Response } from 'express';
import { authService } from '../services/authService';

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const resultado = await authService.login(username, password);
  res.json(resultado);
};

export const verifyToken = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const resultado = await authService.verifyToken(token!);
  res.json(resultado);
};
