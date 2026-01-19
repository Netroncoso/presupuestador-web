import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export class AlertasEquipamientosService {
  
  async obtenerTodas() {
    const [rows] = await pool.query(
      'SELECT * FROM tipos_equipamiento ORDER BY nombre'
    );
    return rows;
  }

  async actualizar(id: number, datos: {
    cantidad_maxima: number;
    mensaje_alerta: string;
    color_alerta: string;
    activo_alerta: boolean;
  }) {
    if (isNaN(id)) {
      throw new AppError(400, 'ID inválido');
    }

    const { cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta } = datos;

    const [result]: any = await pool.query(
      `UPDATE tipos_equipamiento 
       SET cantidad_maxima = ?, mensaje_alerta = ?, color_alerta = ?, activo_alerta = ?
       WHERE id = ?`,
      [cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Tipo no encontrado');
    }

    return { ok: true, mensaje: 'Alerta actualizada' };
  }
}

export const alertasEquipamientosService = new AlertasEquipamientosService();
