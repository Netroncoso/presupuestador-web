import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// Obtener histórico de valores de un servicio-prestador
export const getValoresPrestadorServicio = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!id || isNaN(Number(id))) {
    throw new AppError(400, "ID inválido");
  }

  const [rows] = await pool.query(
    `SELECT 
      id, 
      valor_asignado,
      valor_facturar,
      fecha_inicio, 
      fecha_fin,
      created_at
     FROM prestador_servicio_valores 
     WHERE id_prestador_servicio = ? 
     ORDER BY fecha_inicio DESC`,
    [id]
  );

  res.json(rows);
});

// Guardar nuevo valor con fecha_inicio
export const guardarValorPrestadorServicio = asyncHandler(async (req: Request, res: Response) => {
  const prestadorServicioId = Number(req.params.id);
  const { valor_asignado, valor_facturar, fecha_inicio } = req.body;

  if (!prestadorServicioId || !valor_asignado || !valor_facturar || !fecha_inicio) {
    throw new AppError(400, "Datos incompletos: valor_asignado, valor_facturar y fecha_inicio requeridos");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Cerrar todos los períodos vigentes o que solapan con la nueva fecha
    await connection.query(
      `UPDATE prestador_servicio_valores 
       SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
       WHERE id_prestador_servicio = ? 
         AND fecha_inicio < ?
         AND (fecha_fin IS NULL OR fecha_fin >= ?)`,
      [fecha_inicio, prestadorServicioId, fecha_inicio, fecha_inicio]
    );

    // Insertar nuevo período
    await connection.query(
      `INSERT INTO prestador_servicio_valores 
       (id_prestador_servicio, valor_asignado, valor_facturar, fecha_inicio) 
       VALUES (?, ?, ?, ?)`,
      [prestadorServicioId, valor_asignado, valor_facturar, fecha_inicio]
    );

    await connection.commit();
    res.json({ 
      ok: true, 
      message: 'Valor guardado correctamente',
      id_prestador_servicio: prestadorServicioId
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// Función interna para obtener valor vigente por fecha
export const obtenerValorVigente = async (prestadorServicioId: number, fecha: string | null = null) => {
  const fechaConsulta = fecha || new Date().toISOString().slice(0, 10);
  
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT valor_asignado, valor_facturar 
     FROM prestador_servicio_valores 
     WHERE id_prestador_servicio = ? 
       AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
     LIMIT 1`,
    [prestadorServicioId, fechaConsulta]
  );

  return rows.length ? rows[0] : null;
};
