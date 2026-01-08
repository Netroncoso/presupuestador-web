import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { cacheService } from '../services/cacheService';

// Obtener histórico de valores de un servicio-financiador
export const getValoresFinanciadorServicio = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    throw new AppError(400, "ID inválido");
  }

  const [rows] = await pool.query(
    `SELECT 
      id, 
      valor_asignado,
      valor_facturar,
      fecha_inicio, 
      fecha_fin,
      sucursal_id,
      created_at
     FROM financiador_servicio_valores 
     WHERE financiador_servicio_id = ? 
     ORDER BY fecha_inicio DESC`,
    [id]
  );

  res.json(rows);
});

// Guardar nuevo valor con fecha_inicio
export const guardarValorFinanciadorServicio = asyncHandler(async (req: Request, res: Response) => {
  let financiadorServicioId = Number(req.params.id);
  const { valor_asignado, valor_facturar, fecha_inicio, sucursal_id, id_servicio, financiador_id } = req.body;

  if (!valor_asignado || !valor_facturar || !fecha_inicio) {
    throw new AppError(400, "Datos incompletos: valor_asignado, valor_facturar y fecha_inicio requeridos");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Si no existe financiadorServicioId, crear registro en financiador_servicio
    if (!financiadorServicioId || financiadorServicioId === 0 || isNaN(financiadorServicioId)) {
      if (!id_servicio || !financiador_id) {
        throw new AppError(400, "id_servicio e financiador_id requeridos para crear servicio nuevo");
      }

      // Verificar si ya existe
      const [existing] = await connection.query<RowDataPacket[]>(
        'SELECT id as id_financiador_servicio FROM financiador_servicio WHERE id_servicio = ? AND financiador_id = ?',
        [id_servicio, financiador_id]
      );

      if (existing.length > 0) {
        financiadorServicioId = existing[0].id_financiador_servicio;
      } else {
        // Crear nuevo registro activo
        const [result]: any = await connection.query(
          'INSERT INTO financiador_servicio (id_servicio, financiador_id, activo, valor_facturar, valor_sugerido, cant_total) VALUES (?, ?, 1, 0, 0, 0)',
          [id_servicio, financiador_id]
        );
        financiadorServicioId = result.insertId;
      }
    }

    // Cerrar todos los períodos vigentes o que solapan con la nueva fecha para la misma sucursal
    await connection.query(
      `UPDATE financiador_servicio_valores 
       SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
       WHERE financiador_servicio_id = ? 
         AND (sucursal_id = ? OR (sucursal_id IS NULL AND ? IS NULL))
         AND fecha_inicio < ?
         AND (fecha_fin IS NULL OR fecha_fin >= ?)`,
      [fecha_inicio, financiadorServicioId, sucursal_id, sucursal_id, fecha_inicio, fecha_inicio]
    );

    // OPCIÓN 1: Si es valor general, cerrar valores específicos obsoletos (> 30 días)
    if (sucursal_id === null || sucursal_id === undefined) {
      await connection.query(
        `UPDATE financiador_servicio_valores 
         SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
         WHERE financiador_servicio_id = ? 
           AND sucursal_id IS NOT NULL
           AND fecha_fin IS NULL
           AND DATEDIFF(?, fecha_inicio) > 30`,
        [fecha_inicio, financiadorServicioId, fecha_inicio]
      );
    }

    // Insertar nuevo período
    await connection.query(
      `INSERT INTO financiador_servicio_valores 
       (financiador_servicio_id, valor_asignado, valor_facturar, fecha_inicio, sucursal_id) 
       VALUES (?, ?, ?, ?, ?)`,
      [financiadorServicioId, valor_asignado, valor_facturar, fecha_inicio, sucursal_id]
    );

    await connection.commit();
    
    // Invalidar cache de prestaciones
    const cacheKeys = cacheService.keys().filter(k => k.startsWith('prestaciones:'));
    cacheKeys.forEach(k => cacheService.del(k));
    
    res.json({ 
      ok: true, 
      message: 'Valor guardado correctamente',
      id_financiador_servicio: financiadorServicioId
    });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// Función interna para obtener valor vigente por fecha
export const obtenerValorVigente = async (financiadorServicioId: number, fecha: string | null = null) => {
  try {
    const fechaConsulta = fecha || new Date().toISOString().slice(0, 10);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT valor_asignado, valor_facturar 
       FROM financiador_servicio_valores 
       WHERE financiador_servicio_id = ? 
         AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
       LIMIT 1`,
      [financiadorServicioId, fechaConsulta]
    );

    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error('Error obteniendo valor vigente:', error);
    return null;
  }
};
