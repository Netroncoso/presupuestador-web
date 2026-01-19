import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { cacheService } from './cacheService';

export class AdminInsumosService {
  
  async obtenerTodos() {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT idInsumos, producto, costo, codigo_producto FROM insumos ORDER BY producto'
    );
    return rows;
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

  private invalidateCache() {
    // Invalidar todas las páginas de insumos
    cacheService.del('insumos:page:1:limit:100');
    cacheService.del('insumos:page:1:limit:50');
    cacheService.del('insumos:page:1:limit:20');
  }
}

export const adminInsumosService = new AdminInsumosService();
