import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../src/utils/asyncHandler';

describe('AsyncHandler Utility', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  test('should call next function on successful async operation', async () => {
    const successfulHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      res.json({ success: true });
    });

    await successfulHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should call next with error on async operation failure', async () => {
    const error = new Error('Test error');
    const failingHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      throw error;
    });

    await failingHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
    expect(mockRes.json).not.toHaveBeenCalled();
  });

  test('should handle promise rejections', async () => {
    const rejectionHandler = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
      return Promise.reject(new Error('Promise rejection'));
    });

    await rejectionHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Promise rejection' })
    );
  });

  test('should preserve original function behavior', async () => {
    const originalHandler = async (req: Request, res: Response, next: NextFunction) => {
      res.status(201).json({ created: true });
    };

    const wrappedHandler = asyncHandler(originalHandler);
    await wrappedHandler(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({ created: true });
  });
});