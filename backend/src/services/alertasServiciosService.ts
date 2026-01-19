import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { AlertasServicios, MutationResult } from '../types/database';

export class AlertasServiciosService {
  
  async obtenerTodas() {
    const [rows] = await pool.query<AlertasServicios[]>(
      'SELECT * FROM alertas_servicios ORDER BY tipo_unidad'
    );
    return rows;
  }

  async actualizar(id: number, datos: {
    cantidad_maxima: number;
    mensaje_alerta: string;
    color_alerta: string;
    activo: boolean;
  }) {
    if (isNaN(id)) {
      throw new AppError(400, 'ID inválido');
    }

    const { cantidad_maxima, mensaje_alerta, color_alerta, activo } = datos;

    if (cantidad_maxima === undefined || !mensaje_alerta || !color_alerta || activo === undefined) {
      throw new AppError(400, 'Todos los campos son requeridos');
    }

    const [result] = await pool.query<MutationResult>(
      `UPDATE alertas_servicios 
       SET cantidad_maxima = ?, mensaje_alerta = ?, color_alerta = ?, activo = ?
       WHERE id = ?`,
      [cantidad_maxima, mensaje_alerta, color_alerta, activo, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Alerta no encontrada');
    }

    return { ok: true, mensaje: 'Alerta actualizada' };
  }

  async crear(datos: {
    tipo_unidad: string;
    cantidad_maxima: number;
    mensaje_alerta: string;
    color_alerta?: string;
    activo?: boolean;
  }) {
    const { tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo } = datos;

    const [result] = await pool.query<MutationResult>(
      `INSERT INTO alertas_servicios (tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo)
       VALUES (?, ?, ?, ?, ?)`,
      [tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta || 'orange', activo ?? 1]
    );

    return { ok: true, id: result.insertId };
  }
}

export const alertasServiciosService = new AlertasServiciosService();
