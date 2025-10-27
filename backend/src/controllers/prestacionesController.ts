import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db';

export const getPrestadores = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT idobra_social, Financiador FROM financiador WHERE activo = 1');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching prestadores:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al obtener prestadores', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getPrestacionesPorPrestador = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(
      `SELECT ps.id_servicio, s.nombre, ps.costo, ps.total_mes, ps.condicion, ps.cant_total
       FROM prestador_servicio AS ps
       JOIN servicios AS s ON ps.id_servicio = s.id_servicio
       WHERE ps.idobra_social = ? AND ps.activo = 1`, [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching prestaciones:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al obtener prestaciones', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const getPrestadorInfo = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT tasa_mensual, dias_cobranza_teorico, dias_cobranza_real FROM financiador WHERE idobra_social = ?',
      [id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    console.error('Error fetching prestador info:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al obtener información del prestador', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};
