import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export class FinanciadoresService {
  
  async obtenerTodos() {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT f.id, f.Financiador, f.activo, f.tasa_mensual, 
              f.dias_cobranza_teorico, f.dias_cobranza_real, f.id_acuerdo, 
              COALESCE(a.nombre, NULL) as acuerdo_nombre
       FROM financiador f
       LEFT JOIN financiador_acuerdo a ON f.id_acuerdo = a.id_acuerdo
       ORDER BY f.Financiador`
    );
    return rows;
  }

  async actualizar(id: string, datos: {
    activo: number;
    tasa_mensual?: number;
    dias_cobranza_teorico?: number;
    dias_cobranza_real?: number;
    id_acuerdo?: number | null;
  }) {
    if (!id || datos.activo === undefined) {
      throw new AppError(400, 'ID y estado activo son requeridos');
    }

    const { activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id_acuerdo } = datos;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE financiador SET activo = ?, tasa_mensual = ?, dias_cobranza_teorico = ?, dias_cobranza_real = ?, id_acuerdo = ? WHERE id = ?',
      [activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id_acuerdo ?? null, id]
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