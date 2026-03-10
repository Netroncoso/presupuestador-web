import { pool } from '../db';
import { cacheService } from './cacheService';

export class InsumosService {

  async obtenerTodos(page: number = 1, limit: number = 100, search: string = '') {
    const cacheKey = `insumos:page:${page}:limit:${limit}:search:${search}`;

    const cached = cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const offset = (page - 1) * limit;
    const params: any[] = [];

    let query = `SELECT 
        idInsumos, 
        producto, 
        costo,
        codigo_producto,
        critico,
        COALESCE(DATEDIFF(CURDATE(), fecha_actualizacion), 999) AS dias_sin_actualizar
       FROM insumos`;

    let countQuery = 'SELECT COUNT(*) as total FROM insumos';

    if (search) {
      const searchClause = ' WHERE producto LIKE ? OR codigo_producto LIKE ?';
      query += searchClause;
      countQuery += searchClause;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    query += ' ORDER BY CASE WHEN costo > 0 THEN 0 ELSE 1 END, producto LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    const countParams = search ? [`%${search}%`, `%${search}%`] : [];
    const [countResult] = await pool.query<any[]>(countQuery, countParams);
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
