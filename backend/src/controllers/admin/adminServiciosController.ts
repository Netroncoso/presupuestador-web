import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';
import { asyncHandler } from '../../middleware/errorHandler';

export const getPrestadoresActivos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT idobra_social, Financiador FROM financiador WHERE activo = 1 ORDER BY Financiador'
  );
  res.json(rows);
});

export const getServiciosPorPrestador = asyncHandler(async (req: Request, res: Response) => {
  const { prestadorId } = req.params;
  
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
      s.id_servicio,
      s.nombre,
      s.tipo_unidad,
      ps.id_prestador_servicio,
      ps.valor_facturar,
      ps.activo,
      ps.cant_total,
      ps.valor_sugerido,
      COALESCE(v.count_valores_vigentes, 0) AS count_valores_vigentes,
      v.valor_facturar_vigente,
      v.valor_asignado_vigente,
      v.sucursal_id_vigente
    FROM servicios s
    LEFT JOIN prestador_servicio ps
      ON s.id_servicio = ps.id_servicio
     AND ps.idobra_social = ?
    LEFT JOIN (
      SELECT
        id_prestador_servicio,
        COUNT(*) AS count_valores_vigentes,
        MAX(valor_facturar) AS valor_facturar_vigente,
        MAX(valor_asignado) AS valor_asignado_vigente,
        MAX(sucursal_id) AS sucursal_id_vigente
      FROM prestador_servicio_valores
      WHERE fecha_fin IS NULL
      GROUP BY id_prestador_servicio
    ) v ON v.id_prestador_servicio = ps.id_prestador_servicio
    ORDER BY s.nombre`,
    [prestadorId]
  );
  res.json(rows);
});

export const createOrUpdateServicioPrestador = asyncHandler(async (req: Request, res: Response) => {
  const { prestadorId, servicioId } = req.params;
  const { valor_facturar, activo, cant_total, valor_sugerido } = req.body;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id_prestador_servicio FROM prestador_servicio WHERE idobra_social = ? AND id_servicio = ?',
      [prestadorId, servicioId]
    );

    let prestadorServicioId: number;

    if (existing.length > 0) {
      prestadorServicioId = existing[0].id_prestador_servicio;
      await connection.query<ResultSetHeader>(
        'UPDATE prestador_servicio SET valor_facturar = ?, activo = ?, cant_total = ?, valor_sugerido = ? WHERE id_prestador_servicio = ?',
        [valor_facturar, activo, cant_total, valor_sugerido, prestadorServicioId]
      );

      // Verificar si existe registro en valores históricos
      const [valoresExist] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM prestador_servicio_valores WHERE id_prestador_servicio = ? LIMIT 1',
        [prestadorServicioId]
      );

      // No crear registros históricos desde edición rápida
      // Los valores históricos se gestionan desde la sección dedicada
    } else {
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO prestador_servicio (idobra_social, id_servicio, valor_facturar, activo, cant_total, valor_sugerido) VALUES (?, ?, ?, ?, ?, ?)',
        [prestadorId, servicioId, valor_facturar, activo, cant_total, valor_sugerido]
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
