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
      s.id,
      s.nombre,
      s.descripcion,
      s.tipo_unidad,
      fs.codigo_financiador,
      fs.id as id_financiador_servicio,
      fs.activo,
      fs.unidades_base,
      fs.admite_horas_nocturnas,
      COALESCE(v.count_valores_vigentes, 0) AS count_valores_vigentes,
      v.precio_facturar_vigente,
      v.zona_financiador_id_vigente,
      z.nombre as zona_nombre_vigente
    FROM servicios s
    LEFT JOIN financiador_servicio fs
      ON s.id = fs.servicio_id
     AND fs.financiador_id = ?
    LEFT JOIN (
      SELECT
        financiador_servicio_id,
        COUNT(*) AS count_valores_vigentes,
        MAX(precio_facturar) AS precio_facturar_vigente,
        MAX(zona_financiador_id) AS zona_financiador_id_vigente
      FROM financiador_servicio_valores
      WHERE fecha_fin IS NULL
      GROUP BY financiador_servicio_id
    ) v ON v.financiador_servicio_id = fs.id
    LEFT JOIN financiador_zonas z ON v.zona_financiador_id_vigente = z.id
    WHERE s.activo = 1
    ORDER BY s.nombre`,
    [financiadorId]
  );
  res.json(rows);
});

export const createOrUpdateServicioPrestador = asyncHandler(async (req: Request, res: Response) => {
  const { financiadorId, servicioId } = req.params;
  const { activo } = req.body;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM financiador_servicio WHERE financiador_id = ? AND servicio_id = ?',
      [financiadorId, servicioId]
    );

    if (existing.length > 0) {
      await connection.query<ResultSetHeader>(
        'UPDATE financiador_servicio SET activo = ? WHERE id = ?',
        [activo, existing[0].id]
      );
    } else {
      await connection.query<ResultSetHeader>(
        'INSERT INTO financiador_servicio (financiador_id, servicio_id, activo) VALUES (?, ?, ?)',
        [financiadorId, servicioId, activo]
      );
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
