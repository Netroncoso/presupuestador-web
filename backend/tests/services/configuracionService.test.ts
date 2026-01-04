import { ConfiguracionService } from '../../src/services/configuracionService';
import { pool } from '../../src/db';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/db');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('ConfiguracionService', () => {
  let configuracionService: ConfiguracionService;

  beforeEach(() => {
    configuracionService = new ConfiguracionService();
    jest.clearAllMocks();
  });

  describe('obtener', () => {
    it('should return all configurations when no category provided', async () => {
      const mockConfigs = [
        { clave: 'rentabilidad_minima', valor: '15', categoria: 'auditoria' },
        { clave: 'monto_maximo', valor: '150000', categoria: 'auditoria' }
      ];

      mockPool.query.mockResolvedValueOnce([mockConfigs]);

      const result = await configuracionService.obtener();

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM configuracion_sistema ORDER BY categoria, clave',
        []
      );
      expect(result).toEqual(mockConfigs);
    });

    it('should filter by category when provided', async () => {
      const mockConfigs = [
        { clave: 'rentabilidad_minima', valor: '15', categoria: 'auditoria' }
      ];

      mockPool.query.mockResolvedValueOnce([mockConfigs]);

      const result = await configuracionService.obtener('auditoria');

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM configuracion_sistema WHERE categoria = ? ORDER BY categoria, clave',
        ['auditoria']
      );
      expect(result).toEqual(mockConfigs);
    });
  });

  describe('actualizar', () => {
    it('should update configuration successfully', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await configuracionService.actualizar('rentabilidad_minima', '20');

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE configuracion_sistema SET valor = ? WHERE clave = ?',
        ['20', 'rentabilidad_minima']
      );
      expect(result).toEqual({ ok: true, mensaje: 'Configuración actualizada' });
    });

    it('should throw error when configuration not found', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      await expect(configuracionService.actualizar('invalid_key', 'value'))
        .rejects.toThrow(new AppError(404, 'Configuración no encontrada'));
    });

    it('should throw error with missing parameters', async () => {
      await expect(configuracionService.actualizar('', 'value'))
        .rejects.toThrow(new AppError(400, 'Clave y valor son requeridos'));

      await expect(configuracionService.actualizar('key', undefined))
        .rejects.toThrow(new AppError(400, 'Clave y valor son requeridos'));
    });
  });

  describe('actualizarMultiple', () => {
    it('should update multiple configurations in transaction', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        query: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };

      mockPool.getConnection.mockResolvedValueOnce(mockConnection);

      const configuraciones = [
        { clave: 'rentabilidad_minima', valor: '20' },
        { clave: 'monto_maximo', valor: '200000' }
      ];

      const result = await configuracionService.actualizarMultiple(configuraciones);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toEqual({ ok: true, mensaje: 'Configuraciones actualizadas' });
    });

    it('should rollback on error', async () => {
      const mockConnection = {
        beginTransaction: jest.fn(),
        query: jest.fn().mockRejectedValueOnce(new Error('DB Error')),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };

      mockPool.getConnection.mockResolvedValueOnce(mockConnection);

      const configuraciones = [{ clave: 'test', valor: 'value' }];

      await expect(configuracionService.actualizarMultiple(configuraciones))
        .rejects.toThrow('DB Error');

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it('should validate input array', async () => {
      await expect(configuracionService.actualizarMultiple([]))
        .rejects.toThrow(new AppError(400, 'Se esperaba un array de configuraciones no vacío'));

      await expect(configuracionService.actualizarMultiple([{ clave: '', valor: 'test' }]))
        .rejects.toThrow(new AppError(400, 'Cada configuración debe tener clave y valor'));
    });
  });
});