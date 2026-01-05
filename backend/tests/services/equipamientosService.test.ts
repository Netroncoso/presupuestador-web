import { EquipamientosService } from '../../src/services/equipamientosService';
import { pool } from '../../src/db';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/db', () => ({
  pool: {
    query: jest.fn(),
    getConnection: jest.fn()
  }
}));

jest.mock('../../src/middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(public statusCode: number, message: string) {
      super(message);
      this.name = 'AppError';
    }
  }
}));

const mockPool = pool as jest.Mocked<typeof pool>;

describe('EquipamientosService', () => {
  let service: EquipamientosService;

  beforeEach(() => {
    service = new EquipamientosService();
    jest.clearAllMocks();
  });

  describe('obtenerTodos', () => {
    it('should return all equipamientos', async () => {
      const mockData = [
        { id: 1, nombre: 'Equipo 1', tipo: 'oxigenoterapia', precio_referencia: 1000, activo: 1 },
        { id: 2, nombre: 'Equipo 2', tipo: 'mobiliario', precio_referencia: 2000, activo: 1 }
      ];

      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerTodos();

      expect(result).toEqual(mockData);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('SELECT e.id'));
    });
  });

  describe('obtenerActivos', () => {
    it('should return only active equipamientos', async () => {
      const mockData = [
        { id: 1, nombre: 'Equipo Activo', tipo: 'oxigenoterapia', activo: 1 }
      ];

      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerActivos();

      expect(result).toEqual(mockData);
      expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.activo = 1'));
    });
  });

  describe('crear', () => {
    it('should create new equipamiento', async () => {
      const mockInsertResult = { insertId: 123 };
      mockPool.query.mockResolvedValueOnce([mockInsertResult] as any);

      const datos = {
        nombre: 'Nuevo Equipo',
        tipo_equipamiento_id: 1,
        precio_referencia: 5000,
        activo: 1
      };

      const result = await service.crear(datos);

      expect(result).toEqual({ success: true, id: 123 });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO equipamientos'),
        [datos.nombre, datos.tipo_equipamiento_id, datos.precio_referencia, datos.activo]
      );
    });
  });

  describe('actualizar', () => {
    it('should update equipamiento', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

      const datos = {
        nombre: 'Equipo Actualizado',
        tipo_equipamiento_id: 2,
        precio_referencia: 6000,
        activo: 1
      };

      const result = await service.actualizar('1', datos);

      expect(result).toEqual({ success: true });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE equipamientos'),
        [datos.nombre, datos.tipo_equipamiento_id, datos.precio_referencia, datos.activo, '1']
      );
    });
  });

  describe('eliminar', () => {
    it('should delete equipamiento', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

      const result = await service.eliminar('1');

      expect(result).toEqual({ success: true });
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM equipamientos WHERE id = ?',
        ['1']
      );
    });
  });

  describe('obtenerValoresHistoricos', () => {
    it('should return empty array for id = 0', async () => {
      const result = await service.obtenerValoresHistoricos('0');
      expect(result).toEqual([]);
    });

    it('should return historical values for valid id', async () => {
      const mockData = [
        { id: 1, valor_asignado: 1000, valor_facturar: 1200, fecha_inicio: '2024-01-01' }
      ];

      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerValoresHistoricos('5');

      expect(result).toEqual(mockData);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM financiador_equipamiento_valores'),
        [5]
      );
    });

    it('should throw error for invalid id', async () => {
      await expect(service.obtenerValoresHistoricos('invalid')).rejects.toThrow('ID de acuerdo inválido');
    });

    it('should throw error for negative id', async () => {
      await expect(service.obtenerValoresHistoricos('-1')).rejects.toThrow('ID de acuerdo inválido');
    });
  });

  describe('obtenerTipos', () => {
    it('should return all tipos de equipamiento', async () => {
      const mockData = [
        { id: 1, nombre: 'oxigenoterapia', descripcion: 'Equipos de oxígeno' },
        { id: 2, nombre: 'mobiliario', descripcion: 'Muebles médicos' }
      ];

      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerTipos();

      expect(result).toEqual(mockData);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM tipos_equipamiento ORDER BY nombre'
      );
    });
  });

  describe('crearTipo', () => {
    it('should create new tipo de equipamiento', async () => {
      const mockInsertResult = { insertId: 10 };
      mockPool.query.mockResolvedValueOnce([mockInsertResult] as any);

      const datos = {
        nombre: 'ventilacion',
        descripcion: 'Equipos de ventilación'
      };

      const result = await service.crearTipo(datos);

      expect(result).toEqual({ success: true, id: 10 });
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tipos_equipamiento'),
        [datos.nombre, datos.descripcion]
      );
    });
  });

  describe('actualizarAcuerdo', () => {
    it('should update acuerdo status', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

      const result = await service.actualizarAcuerdo('5', 0);

      expect(result).toEqual({ success: true });
      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE financiador_equipamiento SET activo = ? WHERE id = ?',
        [0, '5']
      );
    });
  });

  describe('eliminarDePresupuesto', () => {
    it('should delete equipamiento from presupuesto', async () => {
      mockPool.query.mockResolvedValueOnce([{ affectedRows: 1 }] as any);

      const result = await service.eliminarDePresupuesto('100', '5');

      expect(result).toEqual({ ok: true });
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM presupuesto_equipamiento WHERE idPresupuestos = ? AND id = ?',
        ['100', '5']
      );
    });
  });

  describe('obtenerDePresupuesto - soloLectura', () => {
    it('should return saved values when soloLectura is true', async () => {
      const mockData = [
        { id: 1, nombre: 'Equipo 1', cantidad: 2, costo: 1000, precio_facturar: 1200 }
      ];

      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerDePresupuesto('100', true);

      expect(result).toEqual(mockData);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM presupuesto_equipamiento'),
        [100]
      );
    });
  });
});
