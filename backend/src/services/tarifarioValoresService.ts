import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export class TarifarioValoresService {
  
  // Obtener servicios del tarifario por zona con 5 valores
  async obtenerServiciosPorZona(zonaTarifarioId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         s.id,
         s.nombre,
         s.descripcion,
         s.tipo_unidad,
         tsv.valor_1,
         tsv.valor_2,
         tsv.valor_3,
         tsv.valor_4,
         tsv.valor_5,
         tsv.fecha_inicio,
         tsv.fecha_fin
       FROM servicios s
       INNER JOIN tarifario_servicio_valores tsv ON s.id = tsv.servicio_id
       WHERE tsv.zona_tarifario_id = ?
         AND s.activo = 1
         AND (tsv.fecha_fin IS NULL OR tsv.fecha_fin >= CURDATE())
       ORDER BY s.nombre`,
      [zonaTarifarioId]
    );
    return rows;
  }

  // Crear o actualizar valores del tarifario
  async crearOActualizarValores(data: {
    servicio_id: number;
    zona_tarifario_id: number;
    valor_1: number;
    valor_2: number;
    valor_3: number;
    valor_4: number;
    valor_5: number;
    fecha_inicio: string;
    fecha_fin?: string;
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Cerrar valores anteriores si existen
      await connection.query(
        `UPDATE tarifario_servicio_valores 
         SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
         WHERE servicio_id = ? AND zona_tarifario_id = ? AND fecha_fin IS NULL`,
        [data.fecha_inicio, data.servicio_id, data.zona_tarifario_id]
      );

      // Insertar nuevos valores
      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO tarifario_servicio_valores 
         (servicio_id, zona_tarifario_id, valor_1, valor_2, valor_3, valor_4, valor_5, fecha_inicio, fecha_fin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.servicio_id,
          data.zona_tarifario_id,
          data.valor_1,
          data.valor_2,
          data.valor_3,
          data.valor_4,
          data.valor_5,
          data.fecha_inicio,
          data.fecha_fin || null
        ]
      );

      await connection.commit();
      return { id: result.insertId, mensaje: 'Valores del tarifario guardados exitosamente' };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Obtener historial de valores
  async obtenerHistorialValores(servicioId: number, zonaTarifarioId: number) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         tsv.*,
         s.nombre as servicio_nombre,
         tz.nombre as zona_nombre
       FROM tarifario_servicio_valores tsv
       INNER JOIN servicios s ON tsv.servicio_id = s.id
       INNER JOIN tarifario_zonas tz ON tsv.zona_tarifario_id = tz.id
       WHERE tsv.servicio_id = ? AND tsv.zona_tarifario_id = ?
       ORDER BY tsv.fecha_inicio DESC`,
      [servicioId, zonaTarifarioId]
    );
    return rows;
  }
}

export const tarifarioValoresService = new TarifarioValoresService();