// Mock the database module first
jest.mock('../../src/db', () => ({
  pool: {
    query: jest.fn()
  }
}));

// Mock the error handler
jest.mock('../../src/middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(public statusCode: number, message: string) {
      super(message);
    }
  }
}));

import { AdminInsumosService } from '../../src/services/adminInsumosService';
import { pool } from '../../src/db';

const mockPool = pool as jest.Mocked<typeof pool>;

describe('AdminInsumosService', () => {
  let service: AdminInsumosService;

  beforeEach(() => {
    service = new AdminInsumosService();
    jest.clearAllMocks();
  });

  describe('obtenerTodos', () => {
    it('should return all insumos', async () => {
      const mockData = [
        { idInsumos: 1, producto: 'Jeringa', costo: 10.50, codigo_producto: 'JER001' }
      ];
      
      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerTodos();

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT idInsumos, producto, costo, codigo_producto FROM insumos ORDER BY producto'
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('crear', () => {
    it('should create insumo successfully', async () => {
      const mockResult = { insertId: 123 };
      mockPool.query.mockResolvedValueOnce([mockResult] as any);

      const datos = { producto: 'Jeringa', costo: 10.50, codigo_producto: 'JER001' };
      const result = await service.crear(datos);

      expect(result.id).toBe(123);
      expect(result.message).toBe('Insumo creado correctamente');
    });

    it('should validate required fields', async () => {
      await expect(service.crear({ producto: '', costo: 10 }))
        .rejects.toThrow('Producto y costo son requeridos');
    });

    it('should handle duplicate entry error', async () => {
      const duplicateError = { code: 'ER_DUP_ENTRY' };
      mockPool.query.mockRejectedValueOnce(duplicateError);

      await expect(service.crear({ producto: 'Test', costo: 10 }))
        .rejects.toThrow('El producto ya existe');
    });
  });

  describe('actualizar', () => {
    it('should update insumo successfully', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

      const result = await service.actualizar('1', {
        producto: 'Jeringa Updated',
        costo: 12.00
      });

      expect(result.message).toBe('Insumo actualizado correctamente');
    });

    it('should throw error when insumo not found', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }] as any);

      await expect(service.actualizar('999', { producto: 'Test', costo: 10 }))
        .rejects.toThrow('Insumo no encontrado');
    });
  });

  describe('eliminar', () => {
    it('should delete insumo successfully', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

      const result = await service.eliminar('1');

      expect(result.message).toBe('Insumo eliminado correctamente');
    });

    it('should throw error when insumo not found', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }] as any);

      await expect(service.eliminar('999'))
        .rejects.toThrow('Insumo no encontrado');
    });
  });
});