import { pool } from '../db';
import { cacheService } from './cacheService';

export class InsumosService {
  
  async obtenerTodos(page: number = 1, limit: number = 100) {
    const cacheKey = `insumos:page:${page}:limit:${limit}`;
    
    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }
    
    const offset = (page - 1) * limit;
    
    const [rows] = await pool.query(
      `SELECT 
        idInsumos, 
        producto, 
        costo,
        COALESCE(DATEDIFF(CURDATE(), fecha_actualizacion), 999) AS dias_sin_actualizar
       FROM insumos 
       ORDER BY producto
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const [countResult] = await pool.query<any[]>('SELECT COUNT(*) as total FROM insumos');
    const total = countResult[0].total;
    
    const result = {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    cacheService.set(cacheKey, result, 1800); // 30 min
    
    return result;
  }
  
  invalidateCache() {
    const keys = cacheService.getStats();
    // Invalidar todas las keys que empiecen con 'insumos:'
    cacheService.del('insumos:page:1:limit:100');
  }
}

export const insumosService = new InsumosService();