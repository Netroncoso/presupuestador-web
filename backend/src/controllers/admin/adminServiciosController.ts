import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';

export const getPrestadoresActivos = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT idobra_social, Financiador FROM financiador WHERE activo = 1 ORDER BY Financiador'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching prestadores activos:', err);
    res.status(500).json({ error: 'Error al obtener prestadores activos' });
  }
};

export const getServiciosPorPrestador = async (req: Request, res: Response) => {
  try {
    const { prestadorId } = req.params;
    
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
        s.id_servicio,
        s.nombre,
        ps.id_prestador_servicio,
        ps.costo,
        ps.total_mes,
        ps.condicion,
        ps.activo,
        ps.cant_total
      FROM servicios s
      LEFT JOIN prestador_servicio ps ON s.id_servicio = ps.id_servicio AND ps.idobra_social = ?
      ORDER BY s.nombre`,
      [prestadorId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching servicios por prestador:', err);
    res.status(500).json({ error: 'Error al obtener servicios por prestador' });
  }
};

export const createOrUpdateServicioPrestador = async (req: Request, res: Response) => {
  try {
    const { prestadorId, servicioId } = req.params;
    const { costo, total_mes, condicion, activo, cant_total } = req.body;

    // Check if relation exists
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id_prestador_servicio FROM prestador_servicio WHERE idobra_social = ? AND id_servicio = ?',
      [prestadorId, servicioId]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.query<ResultSetHeader>(
        'UPDATE prestador_servicio SET costo = ?, total_mes = ?, condicion = ?, activo = ?, cant_total = ? WHERE id_prestador_servicio = ?',
        [costo, total_mes, condicion, activo, cant_total, existing[0].id_prestador_servicio]
      );
    } else {
      // Create new
      await pool.query<ResultSetHeader>(
        'INSERT INTO prestador_servicio (idobra_social, id_servicio, costo, total_mes, condicion, activo, cant_total) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [prestadorId, servicioId, costo, total_mes, condicion, activo, cant_total]
      );
    }

    res.json({ message: 'Servicio actualizado correctamente' });
  } catch (err) {
    console.error('Error updating servicio prestador:', err);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};