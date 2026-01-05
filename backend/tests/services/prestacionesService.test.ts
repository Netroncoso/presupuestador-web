import { PrestacionesService } from '../../src/services/prestacionesService';
import { pool } from '../../src/db';
import { cacheService } from '../../src/services/cacheService';
import { AppError } from '../../src/middleware/errorHandler';

jest.mock('../../src/db', () => ({
  pool: { query: jest.fn() }
}));

jest.mock('../../src/services/cacheService', () => ({
  cacheService: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

jest.mock('../../src/middleware/errorHandler', () => ({
  AppError: class AppError extends Error {
    constructor(public statusCode: number, message: string) {
      super(message);
    }
  }
}));

const mockPool = pool as jest.Mocked<typeof pool>;
const mockCache = cacheService as jest.Mocked<typeof cacheService>;

describe('PrestacionesService', () => {
  let service: PrestacionesService;

  beforeEach(() => {
    service = new PrestacionesService();
    jest.clearAllMocks();
  });

  describe('obtenerPrestadores', () => {
    it('should return cached prestadores if available', async () => {
      const mockData = [
        { idobra_social: 1, Financiador: 'OSDE', activo: 1 },
        { idobra_social: 2, Financiador: 'Swiss Medical', activo: 1 }
      ];

      mockCache.get.mockReturnValueOnce(mockData);

      const result = await service.obtenerPrestadores();

      expect(result).toEqual(mockData);
      expect(mockCache.get).toHaveBeenCalledWith('catalogos:prestadores');
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should fetch and cache prestadores if not cached', async () => {
      const mockData = [
        { idobra_social: 1, Financiador: 'OSDE', activo: 1 }
      ];

      mockCache.get.mockReturnValueOnce(undefined);
      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerPrestadores();

      expect(result).toEqual(mockData);
      expect(mockCache.set).toHaveBeenCalledWith('catalogos:prestadores', mockData, 1800);
    });
  });

  describe('obtenerPrestacionesPorPrestador', () => {
    it('should return prestaciones for valid prestador', async () => {
      const mockData = [
        { id_servicio: 1, nombre: 'Consulta', valor_sugerido: 1000, valor_facturar: 1200 }
      ];

      mockPool.query.mockResolvedValueOnce([mockData] as any);

      const result = await service.obtenerPrestacionesPorPrestador('1', '2024-01-01', null);

      expect(result).toEqual(mockData);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([null, '2024-01-01', '2024-01-01', null, '2024-01-01', '2024-01-01', null, '1'])
      );
    });

    it('should handle sucursal_id parameter', async () => {
      const mockData: any[] = [];
      mockPool.query.mockResolvedValueOnce([mockData] as any);

      await service.obtenerPrestacionesPorPrestador('1', '2024-01-01', 5);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([5, '2024-01-01', '2024-01-01', 5, '2024-01-01', '2024-01-01', 5, '1'])
      );
    });
  });

  describe('obtenerPrestadorInfo', () => {
    it('should return cached prestador info if available', async () => {
      const mockData = { idobra_social: 1, Financiador: 'OSDE', tasa_mensual: 2 };

      mockCache.get.mockReturnValueOnce(mockData);

      const result = await service.obtenerPrestadorInfo('1');

      expect(result).toEqual(mockData);
      expect(mockCache.get).toHaveBeenCalledWith('catalogos:prestador:1');
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should fetch and cache prestador info if not cached', async () => {
      const mockData = { idobra_social: 1, Financiador: 'OSDE', tasa_mensual: 2 };

      mockCache.get.mockReturnValueOnce(undefined);
      mockPool.query.mockResolvedValueOnce([[mockData]] as any);

      const result = await service.obtenerPrestadorInfo('1');

      expect(result).toEqual(mockData);
      expect(mockCache.set).toHaveBeenCalledWith('catalogos:prestador:1', mockData, 1800);
    });

    it('should throw error for invalid prestador id', async () => {
      await expect(service.obtenerPrestadorInfo('invalid')).rejects.toThrow('ID de prestador inválido');
    });

    it('should throw error if prestador not found', async () => {
      mockCache.get.mockReturnValueOnce(undefined);
      mockPool.query.mockResolvedValueOnce([[]] as any);

      await expect(service.obtenerPrestadorInfo('999')).rejects.toThrow('Prestador no encontrado');
    });
  });
});
