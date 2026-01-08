import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';
import { asyncHandler } from '../../middleware/errorHandler';

export const getPrestadoresActivos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, Financiador FROM financiador WHERE activo = 1 ORDER BY Financiador'
  );
  res.json(rows);
});

export const getServiciosPorPrestador = asyncHandler(async (req: Request, res: Response) => {
  const { financiadorId } = req.params;
  
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      s.id_servicio,
      s.nombre,
      s.tipo_unidad,
      ps.id as id_financiador_servicio,
      ps.valor_facturar,
      ps.activo,
      ps.cant_total,
      ps.valor_sugerido,
      COALESCE(v.count_valores_vigentes, 0) AS count_valores_vigentes,
      v.valor_facturar_vigente,
      v.valor_asignado_vigente,
      v.sucursal_id_vigente
    FROM servicios s
    LEFT JOIN financiador_servicio ps
      ON s.id_servicio = ps.id_servicio
     AND ps.financiador_id = ?
    LEFT JOIN (
      SELECT
        financiador_servicio_id,
        COUNT(*) AS count_valores_vigentes,
        MAX(valor_facturar) AS valor_facturar_vigente,
        MAX(valor_asignado) AS valor_asignado_vigente,
        MAX(sucursal_id) AS sucursal_id_vigente
      FROM financiador_servicio_valores
      WHERE fecha_fin IS NULL
      GROUP BY financiador_servicio_id
    ) v ON v.financiador_servicio_id = ps.id
    ORDER BY s.nombre`,
    [financiadorId]
  );
  res.json(rows);
});

export const createOrUpdateServicioPrestador = asyncHandler(async (req: Request, res: Response) => {
  const { financiadorId, servicioId } = req.params;
  const { valor_facturar, activo, cant_total, valor_sugerido } = req.body;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id as id_financiador_servicio FROM financiador_servicio WHERE financiador_id = ? AND id_servicio = ?',
      [financiadorId, servicioId]
    );

    let prestadorServicioId: number;

    if (existing.length > 0) {
      prestadorServicioId = existing[0].id_financiador_servicio;
      await connection.query<ResultSetHeader>(
        'UPDATE financiador_servicio SET valor_facturar = ?, activo = ?, cant_total = ?, valor_sugerido = ? WHERE id = ?',
        [valor_facturar, activo, cant_total, valor_sugerido, prestadorServicioId]
      );

      // Verificar si existe registro en valores históricos
      const [valoresExist] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM financiador_servicio_valores WHERE financiador_servicio_id = ? LIMIT 1',
        [prestadorServicioId]
      );

      // No crear registros históricos desde edición rápida
      // Los valores históricos se gestionan desde la sección dedicada
    } else {
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO financiador_servicio (financiador_id, id_servicio, valor_facturar, activo, cant_total, valor_sugerido) VALUES (?, ?, ?, ?, ?, ?)',
        [financiadorId, servicioId, valor_facturar, activo, cant_total, valor_sugerido]
      );
      prestadorServicioId = result.insertId;
      // No crear registros históricos automáticamente
      // Los valores se gestionan desde la sección dedicada del modal
    }

    await connection.commit();
    res.json({ message: 'Servicio actualizado correctamente' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
