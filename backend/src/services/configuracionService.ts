import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { ConfiguracionSistema, MutationResult } from '../types/database';

export class ConfiguracionService {
  
  async obtener(categoria?: string) {
    let query = 'SELECT * FROM configuracion_sistema';
    const params: any[] = [];
    
    if (categoria) {
      query += ' WHERE categoria = ?';
      params.push(categoria);
    }
    
    query += ' ORDER BY categoria, clave';
    
    const [rows] = await pool.query<ConfiguracionSistema[]>(query, params);
    return rows;
  }

  async actualizar(clave: string, valor: any) {
    if (!clave || valor === undefined) {
      throw new AppError(400, 'Clave y valor son requeridos');
    }

    const [result] = await pool.query<MutationResult>(
      'UPDATE configuracion_sistema SET valor = ? WHERE clave = ?',
      [valor, clave]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Configuración no encontrada');
    }

    return { ok: true, mensaje: 'Configuración actualizada' };
  }

  async actualizarMultiple(configuraciones: Array<{ clave: string; valor: any }>) {
    if (!Array.isArray(configuraciones) || configuraciones.length === 0) {
      throw new AppError(400, 'Se esperaba un array de configuraciones no vacío');
    }

    for (const config of configuraciones) {
      if (!config.clave || config.valor === undefined) {
        throw new AppError(400, 'Cada configuración debe tener clave y valor');
      }
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (const config of configuraciones) {
        await connection.query(
          'UPDATE configuracion_sistema SET valor = ? WHERE clave = ?',
          [config.valor, config.clave]
        );
      }

      await connection.commit();
      return { ok: true, mensaje: 'Configuraciones actualizadas' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const configuracionService = new ConfiguracionService();