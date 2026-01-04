import { AdminInsumosService } from '../../src/services/adminInsumosService';

// Mock the database module
const mockQuery = jest.fn();
jest.mock('../../src/db', () => ({
  pool: {
    query: mockQuery
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
      
      mockQuery.mockResolvedValueOnce([mockData]);

      const result = await service.obtenerTodos();

      expect(mockQuery).toHaveBeenCalledWith(
        'SELECT idInsumos, producto, costo, codigo_producto FROM insumos ORDER BY producto'
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('crear', () => {
    it('should create insumo successfully', async () => {
      const mockResult = { insertId: 123 };
      mockQuery.mockResolvedValueOnce([mockResult]);

      const datos = { producto: 'Jeringa', costo: 10.50, codigo_producto: 'JER001' };
      const result = await service.crear(datos);

      expect(result.id).toBe(123);
      expect(result.message).toBe('Insumo creado correctamente');
    });

    it('should validate required fields', async () => {
      await expect(service.crear({ producto: '', costo: 10 }))
        .rejects.toThrow('Producto y costo son requeridos');
    });
  });

  describe('actualizar', () => {
    it('should update insumo successfully', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await service.actualizar('1', {
        producto: 'Jeringa Updated',
        costo: 12.00
      });

      expect(result.message).toBe('Insumo actualizado correctamente');
    });

    it('should throw error when insumo not found', async () => {
      mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(service.actualizar('999', { producto: 'Test', costo: 10 }))
        .rejects.toThrow('Insumo no encontrado');
    });
  });
});