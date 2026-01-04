import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authService } from '../services/authService';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const resultado = await authService.login(username, password);
  res.json(resultado);
});

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const resultado = await authService.verifyToken(token!);
  res.json(resultado);
});