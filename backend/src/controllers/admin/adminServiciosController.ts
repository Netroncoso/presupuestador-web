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
      ps.valor_sugerido
    FROM servicios s
    LEFT JOIN prestador_servicio ps ON s.id_servicio = ps.id_servicio AND ps.idobra_social = ?
    ORDER BY s.nombre`,
    [prestadorId]
  );
  res.json(rows);
});

export const createOrUpdateServicioPrestador = asyncHandler(async (req: Request, res: Response) => {
  const { prestadorId, servicioId } = req.params;
  const { valor_facturar, activo, cant_total, valor_sugerido } = req.body;

  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id_prestador_servicio FROM prestador_servicio WHERE idobra_social = ? AND id_servicio = ?',
    [prestadorId, servicioId]
  );

  if (existing.length > 0) {
    await pool.query<ResultSetHeader>(
      'UPDATE prestador_servicio SET valor_facturar = ?, activo = ?, cant_total = ?, valor_sugerido = ? WHERE id_prestador_servicio = ?',
      [valor_facturar, activo, cant_total, valor_sugerido, existing[0].id_prestador_servicio]
    );
  } else {
    await pool.query<ResultSetHeader>(
      'INSERT INTO prestador_servicio (idobra_social, id_servicio, valor_facturar, activo, cant_total, valor_sugerido) VALUES (?, ?, ?, ?, ?, ?)',
      [prestadorId, servicioId, valor_facturar, activo, cant_total, valor_sugerido]
    );
  }

  res.json({ message: 'Servicio actualizado correctamente' });
});