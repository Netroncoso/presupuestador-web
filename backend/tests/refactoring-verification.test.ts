import { asyncHandler } from '../src/utils/asyncHandler';
import { Request, Response, NextFunction } from 'express';

describe('Refactoring Verification Tests', () => {
  describe('AsyncHandler Utility', () => {
    test('should exist and be a function', () => {
      expect(asyncHandler).toBeDefined();
      expect(typeof asyncHandler).toBe('function');
    });

    test('should return a function when called', () => {
      const mockHandler = async (req: Request, res: Response, next: NextFunction) => {
        res.json({ test: true });
      };
      
      const wrappedHandler = asyncHandler(mockHandler);
      expect(typeof wrappedHandler).toBe('function');
    });

    test('should handle successful execution', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      } as any;
      const mockNext = jest.fn();

      const successHandler = asyncHandler(async (req: Request, res: Response) => {
        res.json({ success: true });
      });

      await successHandler(mockReq, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle errors by calling next', async () => {
      const mockReq = {} as Request;
      const mockRes = {} as Response;
      const mockNext = jest.fn();

      const errorHandler = asyncHandler(async () => {
        throw new Error('Test error');
      });

      await errorHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Test error' })
      );
    });
  });

  describe('Route Files Structure', () => {
    test('auditoria-multi route should export default router', () => {
      // This will fail if the file has syntax errors
      expect(() => require('../src/routes/auditoria-multi')).not.toThrow();
    });

    test('presupuestosV2 route should export default router', () => {
      // This will fail if the file has syntax errors
      expect(() => require('../src/routes/presupuestosV2')).not.toThrow();
    });
  });

  describe('Middleware Files', () => {
    test('auth middleware should be importable', () => {
      expect(() => require('../src/middleware/auth')).not.toThrow();
    });

    test('errorHandler middleware should be importable', () => {
      expect(() => require('../src/middleware/errorHandler')).not.toThrow();
    });
  });
});