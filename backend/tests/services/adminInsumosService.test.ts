import { AdminInsumosService } from '../../src/services/adminInsumosService';
import { pool } from '../../src/db';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/db');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('AdminInsumosService', () => {
  let adminInsumosService: AdminInsumosService;

  beforeEach(() => {
    adminInsumosService = new AdminInsumosService();
    jest.clearAllMocks();
  });

  describe('obtenerTodos', () => {
    it('should return all insumos', async () => {
      const mockInsumos = [
        { idInsumos: 1, producto: 'Jeringa', costo: 10.50, codigo_producto: 'JER001' },
        { idInsumos: 2, producto: 'Gasas', costo: 5.25, codigo_producto: null }
      ];

      mockPool.query.mockResolvedValueOnce([mockInsumos]);

      const result = await adminInsumosService.obtenerTodos();

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT idInsumos, producto, costo, codigo_producto FROM insumos ORDER BY producto'
      );
      expect(result).toEqual(mockInsumos);
    });
  });

  describe('crear', () => {
    it('should create insumo successfully', async () => {
      const mockResult = { insertId: 123 };
      mockPool.query.mockResolvedValueOnce([mockResult]);

      const datos = { producto: 'Jeringa', costo: 10.50, codigo_producto: 'JER001' };
      const result = await adminInsumosService.crear(datos);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO insumos (producto, costo, codigo_producto) VALUES (?, ?, ?)',
        ['Jeringa', 10.50, 'JER001']
      );
      expect(result).toEqual({
        id: 123,
        producto: 'Jeringa',
        costo: 10.50,
        codigo_producto: 'JER001',
        message: 'Insumo creado correctamente'
      });
    });

    it('should handle duplicate entry error', async () => {
      const duplicateError = { code: 'ER_DUP_ENTRY' };
      mockPool.query.mockRejectedValueOnce(duplicateError);

      const datos = { producto: 'Jeringa', costo: 10.50 };

      await expect(adminInsumosService.crear(datos))
        .rejects.toThrow(new AppError(409, 'El producto ya existe'));
    });

    it('should validate required fields', async () => {
      await expect(adminInsumosService.crear({ producto: '', costo: 10 }))
        .rejects.toThrow(new AppError(400, 'Producto y costo son requeridos'));

      await expect(adminInsumosService.crear({ producto: 'Test', costo: undefined as any }))
        .rejects.toThrow(new AppError(400, 'Producto y costo son requeridos'));
    });

    it('should handle codigo_producto as null when not provided', async () => {
      const mockResult = { insertId: 124 };
      mockPool.query.mockResolvedValueOnce([mockResult]);

      const datos = { producto: 'Gasas', costo: 5.25 };
      await adminInsumosService.crear(datos);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO insumos (producto, costo, codigo_producto) VALUES (?, ?, ?)',
        ['Gasas', 5.25, null]
      );
    });
  });

  describe('actualizar', () => {
    it('should update insumo successfully', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await adminInsumosService.actualizar('1', {
        producto: 'Jeringa Updated',
        costo: 12.00,
        codigo_producto: 'JER002'
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE insumos SET producto = ?, costo = ?, codigo_producto = ? WHERE idInsumos = ?',
        ['Jeringa Updated', 12.00, 'JER002', '1']
      );
      expect(result).toEqual({ message: 'Insumo actualizado correctamente' });
    });

    it('should throw error when insumo not found', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(adminInsumosService.actualizar('999', { producto: 'Test', costo: 10 }))
        .rejects.toThrow(new AppError(404, 'Insumo no encontrado'));
    });
  });

  describe('eliminar', () => {
    it('should delete insumo successfully', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await adminInsumosService.eliminar('1');

      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM insumos WHERE idInsumos = ?',
        ['1']
      );
      expect(result).toEqual({ message: 'Insumo eliminado correctamente' });
    });

    it('should throw error when insumo not found', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(adminInsumosService.eliminar('999'))
        .rejects.toThrow(new AppError(404, 'Insumo no encontrado'));
    });
  });
});