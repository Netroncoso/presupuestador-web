import { pool } from '../db';

export class InsumosService {
  
  async obtenerTodos() {
    const [rows] = await pool.query(
      `SELECT 
        idInsumos, 
        producto, 
        costo,
        COALESCE(DATEDIFF(CURDATE(), fecha_actualizacion), 999) AS dias_sin_actualizar
       FROM insumos 
       ORDER BY producto`
    );
    return rows;
  }
}

export const insumosService = new InsumosService();