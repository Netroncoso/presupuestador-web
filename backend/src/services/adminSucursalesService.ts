import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';

export class AdminSucursalesService {
  
  async obtenerTodas() {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT ID, Sucursales_mh, suc_porcentaje_dificil_acceso, suc_porcentaje_insumos FROM sucursales_mh ORDER BY Sucursales_mh'
    );
    return rows;
  }

  async actualizar(id: string, datos: {
    suc_porcentaje_dificil_acceso: number;
    suc_porcentaje_insumos: number;
  }) {
    const { suc_porcentaje_dificil_acceso, suc_porcentaje_insumos } = datos;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE sucursales_mh SET suc_porcentaje_dificil_acceso = ?, suc_porcentaje_insumos = ? WHERE ID = ?',
      [suc_porcentaje_dificil_acceso, suc_porcentaje_insumos, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Sucursal no encontrada');
    }

    return { message: 'Sucursal actualizada correctamente' };
  }
}

export const adminSucursalesService = new AdminSucursalesService();