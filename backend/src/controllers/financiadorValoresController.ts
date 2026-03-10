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
      v.id, 
      v.precio_facturar,
      v.fecha_inicio, 
      v.fecha_fin,
      v.zona_financiador_id,
      z.nombre as zona_nombre,
      v.created_at
     FROM financiador_servicio_valores v
     LEFT JOIN financiador_zonas z ON v.zona_financiador_id = z.id
     WHERE v.financiador_servicio_id = ? 
     ORDER BY v.fecha_inicio DESC`,
    [id]
  );

  res.json(rows);
});

// Guardar nuevo valor con fecha_inicio
export const guardarValorFinanciadorServicio = asyncHandler(async (req: Request, res: Response) => {
  let financiadorServicioId = Number(req.params.id);
  const { precio_facturar, fecha_inicio, zona_financiador_id, servicio_id, financiador_id } = req.body;

  if (!precio_facturar || !fecha_inicio || !zona_financiador_id) {
    throw new AppError(400, "Datos incompletos: precio_facturar, fecha_inicio y zona_financiador_id requeridos");
  }

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Si no existe financiadorServicioId, crear registro en financiador_servicio
    if (!financiadorServicioId || financiadorServicioId === 0 || isNaN(financiadorServicioId)) {
      if (!servicio_id || !financiador_id) {
        throw new AppError(400, "servicio_id y financiador_id requeridos para crear servicio nuevo");
      }

      // Verificar si ya existe
      const [existing] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM financiador_servicio WHERE servicio_id = ? AND financiador_id = ?',
        [servicio_id, financiador_id]
      );

      if (existing.length > 0) {
        financiadorServicioId = existing[0].id;
      } else {
        // Crear nuevo registro activo
        const [result]: any = await connection.query(
          'INSERT INTO financiador_servicio (servicio_id, financiador_id, activo) VALUES (?, ?, 1)',
          [servicio_id, financiador_id]
        );
        financiadorServicioId = result.insertId;
      }
    }

    // Lógica inteligente de cierre de períodos
    // 1. Si la nueva fecha es HOY o pasado: cerrar todos los vigentes
    // 2. Si la nueva fecha es FUTURA: cerrar solo los que se solapan
    
    const fechaNueva = new Date(fecha_inicio);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaNueva.setHours(0, 0, 0, 0);
    
    if (fechaNueva <= hoy) {
      // Fecha actual o pasada: cerrar TODOS los vigentes
      await connection.query(
        `UPDATE financiador_servicio_valores 
         SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
         WHERE financiador_servicio_id = ? 
           AND zona_financiador_id = ?
           AND fecha_fin IS NULL`,
        [fecha_inicio, financiadorServicioId, zona_financiador_id]
      );
    } else {
      // Fecha futura: cerrar solo los que se solapan con el nuevo período
      // Buscar el valor vigente actual
      const [vigente] = await connection.query<RowDataPacket[]>(
        `SELECT id, fecha_inicio 
         FROM financiador_servicio_valores 
         WHERE financiador_servicio_id = ? 
           AND zona_financiador_id = ?
           AND fecha_fin IS NULL
           AND fecha_inicio < ?
         ORDER BY fecha_inicio DESC
         LIMIT 1`,
        [financiadorServicioId, zona_financiador_id, fecha_inicio]
      );
      
      if (vigente.length > 0) {
        // Cerrar el vigente actual un día antes de la nueva fecha
        await connection.query(
          `UPDATE financiador_servicio_valores 
           SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
           WHERE id = ?`,
          [fecha_inicio, vigente[0].id]
        );
      }
      
      // Eliminar cualquier valor futuro que se solape
      await connection.query(
        `DELETE FROM financiador_servicio_valores 
         WHERE financiador_servicio_id = ? 
           AND zona_financiador_id = ?
           AND fecha_inicio >= ?
           AND fecha_fin IS NULL`,
        [financiadorServicioId, zona_financiador_id, fecha_inicio]
      );
    }

    // Insertar nuevo período
    await connection.query(
      `INSERT INTO financiador_servicio_valores 
       (financiador_servicio_id, precio_facturar, fecha_inicio, zona_financiador_id) 
       VALUES (?, ?, ?, ?)`,
      [financiadorServicioId, precio_facturar, fecha_inicio, zona_financiador_id]
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

// Función interna para obtener valor vigente por fecha y zona
export const obtenerValorVigente = async (financiadorServicioId: number, zonaFinanciadorId: number, fecha: string | null = null) => {
  try {
    const fechaConsulta = fecha || new Date().toISOString().slice(0, 10);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT precio_facturar 
       FROM financiador_servicio_valores 
       WHERE financiador_servicio_id = ? 
         AND zona_financiador_id = ?
         AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
       LIMIT 1`,
      [financiadorServicioId, zonaFinanciadorId, fechaConsulta]
    );

    return rows.length ? rows[0] : null;
  } catch (error) {
    console.error('Error obteniendo valor vigente:', error);
    return null;
  }
};
