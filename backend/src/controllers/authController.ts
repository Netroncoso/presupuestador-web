import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}
const JWT_SECRET = process.env.JWT_SECRET;

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new AppError(400, 'Username y password son requeridos');
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, username, password, rol FROM usuarios WHERE username = ? AND activo = 1',
    [username]
  );

  if (rows.length === 0) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const user = rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, rol: user.rol },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      rol: user.rol
    }
  });
});

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new AppError(401, 'Token no proporcionado');
  }

  const decoded = jwt.verify(token, JWT_SECRET) as any;
  res.json({ user: decoded });
});