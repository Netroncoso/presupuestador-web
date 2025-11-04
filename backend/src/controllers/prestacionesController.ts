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
      `SELECT ps.id_servicio, s.nombre, ps.costo, ps.total_mes, ps.condicion, ps.cant_total, ps.valor_sugerido
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
    
    // Validar que el ID sea un número válido
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID de prestador inválido' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         f.idobra_social, 
         f.Financiador, 
         f.activo, 
         f.tasa_mensual, 
         f.dias_cobranza_teorico, 
         f.dias_cobranza_real, 
         f.id_acuerdo, 
         COALESCE(a.nombre, NULL) as acuerdo_nombre
       FROM financiador f
       LEFT JOIN financiador_acuerdo a ON f.id_acuerdo = a.id_acuerdo
       WHERE f.idobra_social = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prestador no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching prestador info:', err);
    res.status(500).json({ 
      error: 'Error al obtener información del prestador', 
      details: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
};
