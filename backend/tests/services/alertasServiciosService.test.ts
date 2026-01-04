import { AlertasServiciosService } from '../../src/services/alertasServiciosService';
import { pool } from '../../src/db';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/db');

const mockPool = pool as jest.Mocked<typeof pool>;

describe('AlertasServiciosService', () => {
  let alertasServiciosService: AlertasServiciosService;

  beforeEach(() => {
    alertasServiciosService = new AlertasServiciosService();
    jest.clearAllMocks();
  });

  describe('obtenerTodas', () => {
    it('should return all alertas servicios', async () => {
      const mockAlertas = [
        { id: 1, tipo_unidad: 'consulta', cantidad_maxima: 5, mensaje_alerta: 'Muchas consultas', color_alerta: 'orange', activo: 1 },
        { id: 2, tipo_unidad: 'cirugia', cantidad_maxima: 2, mensaje_alerta: 'Muchas cirugías', color_alerta: 'red', activo: 1 }
      ];

      mockPool.query.mockResolvedValueOnce([mockAlertas]);

      const result = await alertasServiciosService.obtenerTodas();

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM alertas_servicios ORDER BY tipo_unidad'
      );
      expect(result).toEqual(mockAlertas);
    });
  });

  describe('actualizar', () => {
    it('should update alerta successfully', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const datos = {
        cantidad_maxima: 10,
        mensaje_alerta: 'Alerta actualizada',
        color_alerta: 'yellow',
        activo: true
      };

      const result = await alertasServiciosService.actualizar(1, datos);

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE alertas_servicios SET cantidad_maxima = ?, mensaje_alerta = ?, color_alerta = ?, activo = ? WHERE id = ?',
        [10, 'Alerta actualizada', 'yellow', true, 1]
      );
      expect(result).toEqual({ ok: true, mensaje: 'Alerta actualizada' });
    });

    it('should throw error when alerta not found', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 0 }]);

      const datos = {
        cantidad_maxima: 10,
        mensaje_alerta: 'Test',
        color_alerta: 'red',
        activo: true
      };

      await expect(alertasServiciosService.actualizar(999, datos))
        .rejects.toThrow(new AppError(404, 'Alerta no encontrada'));
    });

    it('should validate required fields', async () => {
      const invalidData = {
        cantidad_maxima: undefined as any,
        mensaje_alerta: 'Test',
        color_alerta: 'red',
        activo: true
      };

      await expect(alertasServiciosService.actualizar(1, invalidData))
        .rejects.toThrow(new AppError(400, 'Todos los campos son requeridos'));
    });

    it('should validate ID', async () => {
      const datos = {
        cantidad_maxima: 10,
        mensaje_alerta: 'Test',
        color_alerta: 'red',
        activo: true
      };

      await expect(alertasServiciosService.actualizar(NaN, datos))
        .rejects.toThrow(new AppError(400, 'ID inválido'));
    });
  });

  describe('crear', () => {
    it('should create alerta successfully', async () => {
      const mockResult = { insertId: 123 };
      mockPool.query.mockResolvedValueOnce([mockResult]);

      const datos = {
        tipo_unidad: 'consulta',
        cantidad_maxima: 5,
        mensaje_alerta: 'Nueva alerta',
        color_alerta: 'blue',
        activo: true
      };

      const result = await alertasServiciosService.crear(datos);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO alertas_servicios (tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo) VALUES (?, ?, ?, ?, ?)',
        ['consulta', 5, 'Nueva alerta', 'blue', true]
      );
      expect(result).toEqual({ ok: true, id: 123 });
    });

    it('should use default values when not provided', async () => {
      const mockResult = { insertId: 124 };
      mockPool.query.mockResolvedValueOnce([mockResult]);

      const datos = {
        tipo_unidad: 'cirugia',
        cantidad_maxima: 3,
        mensaje_alerta: 'Alerta sin color'
      };

      await alertasServiciosService.crear(datos);

      expect(mockPool.query).toHaveBeenCalledWith(
        'INSERT INTO alertas_servicios (tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo) VALUES (?, ?, ?, ?, ?)',
        ['cirugia', 3, 'Alerta sin color', 'orange', 1]
      );
    });
  });
});