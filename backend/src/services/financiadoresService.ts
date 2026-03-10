import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export class FinanciadoresService {

  async obtenerTodos(page: number = 1, limit: number = 50, search: string = '') {
    const offset = (page - 1) * limit;
    const params: any[] = [];

    let whereClause = '';
    if (search) {
      whereClause = 'WHERE f.Financiador LIKE ?';
      params.push(`%${search}%`);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM financiador f ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT f.id, f.Financiador, f.activo, f.tasa_mensual, 
              f.dias_cobranza_teorico, f.dias_cobranza_real, f.id_acuerdo, 
              f.porcentaje_insumos,
              COALESCE(a.nombre, NULL) as acuerdo_nombre
       FROM financiador f
       LEFT JOIN financiador_acuerdo a ON f.id_acuerdo = a.id_acuerdo
       ${whereClause}
       ORDER BY f.Financiador
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async actualizar(id: string, datos: {
    activo: number;
    tasa_mensual?: number;
    dias_cobranza_teorico?: number;
    dias_cobranza_real?: number;
    id_acuerdo?: number | null;
    porcentaje_insumos?: number;
  }) {
    if (!id || datos.activo === undefined) {
      throw new AppError(400, 'ID y estado activo son requeridos');
    }

    const { activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id_acuerdo, porcentaje_insumos } = datos;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE financiador SET activo = ?, tasa_mensual = ?, dias_cobranza_teorico = ?, dias_cobranza_real = ?, id_acuerdo = ?, porcentaje_insumos = ? WHERE id = ?',
      [activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id_acuerdo ?? null, porcentaje_insumos ?? 0, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Prestador no encontrado');
    }

    return { message: 'Prestador actualizado correctamente' };
  }

  async obtenerAcuerdos() {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_acuerdo, nombre FROM financiador_acuerdo ORDER BY nombre'
    );
    return rows;
  }
}

export const financiadoresService = new FinanciadoresService();
