import { pool } from '../db';
import { cacheService } from './cacheService';

export class SucursalesService {
  
  async obtenerTodas() {
    const cacheKey = 'catalogos:sucursales';
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const [rows] = await pool.query(
      'SELECT ID, Sucursales_mh, suc_porcentaje_insumos FROM sucursales_mh ORDER BY Sucursales_mh'
    );
    
    cacheService.set(cacheKey, rows, 1800); // 30 min
    return rows;
  }
}

export const sucursalesService = new SucursalesService();