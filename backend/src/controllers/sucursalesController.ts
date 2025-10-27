import { Request, Response } from 'express';
import { pool } from '../db';

export const getSucursales = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT Sucursales_mh, suc_porcentaje_insumos FROM sucursales_mh');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching sucursales:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al obtener sucursales', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};
