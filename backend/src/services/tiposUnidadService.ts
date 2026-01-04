import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { TiposUnidad, MutationResult } from '../types/database';

export class TiposUnidadService {
  
  async obtenerActivos() {
    const [rows] = await pool.query<TiposUnidad[]>(
      'SELECT * FROM tipos_unidad WHERE activo = 1 ORDER BY nombre'
    );
    return rows;
  }

  async crear(nombre: string, descripcion?: string) {
    if (!nombre) {
      throw new AppError(400, 'El nombre es requerido');
    }

    const [result] = await pool.query<MutationResult>(
      'INSERT INTO tipos_unidad (nombre, descripcion) VALUES (?, ?)',
      [nombre, descripcion]
    );

    return { ok: true, id: result.insertId };
  }
}

export const tiposUnidadService = new TiposUnidadService();