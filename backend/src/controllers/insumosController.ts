import { Request, Response } from 'express';
import { pool } from '../db';

export const getInsumos = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT producto, costo FROM insumos');
    // rows like [{ producto: 'X', costo: 10 }, ...]
    res.json(rows);
  } catch (err) {
    console.error('Error fetching insumos:', err);
    res.status(500).json({ error: 'Error al obtener insumos', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};
