import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { cacheService } from './cacheService';

export class AdminInsumosService {

  async obtenerTodos(page: number = 1, limit: number = 50, search: string = '') {
    const cacheKey = `admin:insumos:page:${page}:limit:${limit}:search:${search}`;
    const cached = cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const offset = (page - 1) * limit;

    let query = 'SELECT idInsumos, producto, costo, codigo_producto, critico FROM insumos';
    let countQuery = 'SELECT COUNT(*) as total FROM insumos';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      const searchClause = ' WHERE producto LIKE ? OR codigo_producto LIKE ?';
      query += searchClause;
      countQuery += searchClause;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    query += ' ORDER BY producto LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, countParams);

    const result = {
      data: rows,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };

    cacheService.set(cacheKey, result, 300); // 5 minutes cache
    return result;
  }

  async crear(datos: { producto: string; costo: number; codigo_producto?: string }) {
    const { producto, costo, codigo_producto } = datos;

    if (!producto || costo === undefined) {
      throw new AppError(400, 'Producto y costo son requeridos');
    }

    try {
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO insumos (producto, costo, codigo_producto) VALUES (?, ?, ?)',
        [producto, costo, codigo_producto || null]
      );

      return {
        id: result.insertId,
        producto,
        costo,
        codigo_producto,
        message: 'Insumo creado correctamente'
      };
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'El producto ya existe');
      }
      throw err;
    } finally {
      this.invalidateCache();
    }
  }

  async actualizar(id: string, datos: { producto: string; costo: number; codigo_producto?: string }) {
    const { producto, costo, codigo_producto } = datos;

    if (!producto || costo === undefined) {
      throw new AppError(400, 'Producto y costo son requeridos');
    }

    try {
      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE insumos SET producto = ?, costo = ?, codigo_producto = ? WHERE idInsumos = ?',
        [producto, costo, codigo_producto || null, id]
      );

      if (result.affectedRows === 0) {
        throw new AppError(404, 'Insumo no encontrado');
      }

      return { message: 'Insumo actualizado correctamente' };
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'El producto ya existe');
      }
      throw err;
    } finally {
      this.invalidateCache();
    }
  }

  async eliminar(id: string) {
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM insumos WHERE idInsumos = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Insumo no encontrado');
    }

    this.invalidateCache();
    return { message: 'Insumo eliminado correctamente' };
  }

  async toggleCritico(id: string, critico: boolean) {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE insumos SET critico = ? WHERE idInsumos = ?',
      [critico ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Insumo no encontrado');
    }

    this.invalidateCache();
    return { success: true, message: `Insumo ${critico ? 'marcado' : 'desmarcado'} como crítico` };
  }

  private invalidateCache() {
    // Invalidar todas las páginas de insumos
    // Invalidar caché de admin insumos
    try {
      const keys = cacheService.keys();
      const insumoKeys = keys.filter((key: string) => key.startsWith('admin:insumos:') || key.startsWith('insumos:'));
      insumoKeys.forEach((key: string) => cacheService.del(key));
    } catch (error) {
      console.warn('Error clearing insumos cache:', error);
    }
  }
}

export const adminInsumosService = new AdminInsumosService();
