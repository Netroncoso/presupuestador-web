import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  
  private getJwtSecret(): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required');
    }
    return process.env.JWT_SECRET;
  }

  async login(username: string, password: string) {
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
      this.getJwtSecret(),
      { expiresIn: '1h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol
      }
    };
  }

  async verifyToken(token: string) {
    if (!token) {
      throw new AppError(401, 'Token no proporcionado');
    }

    const decoded = jwt.verify(token, this.getJwtSecret()) as any;
    return { user: decoded };
  }
}

export const authService = new AuthService();