import { AuthService } from '../../src/services/authService';
import { pool } from '../../src/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../../src/middleware/errorHandler';

// Mock dependencies
jest.mock('../../src/db');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockPool = pool as jest.Mocked<typeof pool>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        rol: 'usuario_normal'
      };

      mockPool.query.mockResolvedValueOnce([[mockUser]]);
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockJwt.sign.mockReturnValueOnce('mock-token');

      const result = await authService.login('testuser', 'password123');

      expect(result).toEqual({
        token: 'mock-token',
        user: {
          id: 1,
          username: 'testuser',
          rol: 'usuario_normal'
        }
      });
    });

    it('should throw error with invalid username', async () => {
      mockPool.query.mockResolvedValueOnce([[]]);

      await expect(authService.login('invalid', 'password'))
        .rejects.toThrow(new AppError(401, 'Credenciales inválidas'));
    });

    it('should throw error with invalid password', async () => {
      const mockUser = { id: 1, username: 'testuser', password: 'hashedpassword', rol: 'usuario_normal' };
      mockPool.query.mockResolvedValueOnce([[mockUser]]);
      mockBcrypt.compare.mockResolvedValueOnce(false);

      await expect(authService.login('testuser', 'wrongpassword'))
        .rejects.toThrow(new AppError(401, 'Credenciales inválidas'));
    });

    it('should throw error with missing credentials', async () => {
      await expect(authService.login('', 'password'))
        .rejects.toThrow(new AppError(400, 'Username y password son requeridos'));
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockDecoded = { id: 1, username: 'testuser', rol: 'usuario_normal' };
      mockJwt.verify.mockReturnValueOnce(mockDecoded);

      const result = await authService.verifyToken('valid-token');

      expect(result).toEqual({ user: mockDecoded });
    });

    it('should throw error with missing token', async () => {
      await expect(authService.verifyToken(''))
        .rejects.toThrow(new AppError(401, 'Token no proporcionado'));
    });
  });
});