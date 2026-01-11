import { cargaService } from '../src/services/cargaService';

// Mock de dependencias
jest.mock('../src/db', () => ({
  pool: {
    query: jest.fn(),
    getConnection: jest.fn(() => ({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn()
    }))
  }
}));

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Carga Service Tests', () => {
  const mockPool = require('../src/db').pool;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerCasosPendientes', () => {
    it('debe obtener casos pendientes exitosamente', async () => {
      const casosMock = [
        {
          idPresupuestos: 1,
          Nombre_Apellido: 'Juan Pérez',
          DNI: '12345678',
          total_facturar: 50000,
          sucursal_nombre: 'Centro',
          financiador_nombre: 'OSDE',
          horas_pendiente: 2
        }
      ];

      mockPool.query.mockResolvedValue([casosMock]);

      const resultado = await cargaService.obtenerCasosPendientes(1);

      expect(resultado).toEqual(casosMock);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.estado = \'pendiente_carga\''),
        [1]
      );
    });

    it('debe manejar errores de base de datos', async () => {
      mockPool.query.mockRejectedValue(new Error('Database error'));

      await expect(cargaService.obtenerCasosPendientes(1))
        .rejects.toThrow('Database error');
    });
  });

  describe('obtenerCasosEnProceso', () => {
    it('debe obtener casos en proceso exitosamente', async () => {
      const casosMock = [
        {
          idPresupuestos: 1,
          Nombre_Apellido: 'María García',
          DNI: '87654321',
          total_facturar: 75000,
          minutos_en_proceso: 15
        }
      ];

      mockPool.query.mockResolvedValue([casosMock]);

      const resultado = await cargaService.obtenerCasosEnProceso(1);

      expect(resultado).toEqual(casosMock);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.estado = \'en_carga\''),
        [1]
      );
    });
  });

  describe('autoLiberarCasosInactivos', () => {
    it('debe liberar casos inactivos exitosamente', async () => {
      mockPool.query.mockResolvedValue([{ affectedRows: 3 }]);

      const resultado = await cargaService.autoLiberarCasosInactivos();

      expect(resultado).toBe(3);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE presupuestos')
      );
    });

    it('debe retornar 0 si no hay casos para liberar', async () => {
      mockPool.query.mockResolvedValue([{ affectedRows: 0 }]);

      const resultado = await cargaService.autoLiberarCasosInactivos();

      expect(resultado).toBe(0);
    });
  });
});