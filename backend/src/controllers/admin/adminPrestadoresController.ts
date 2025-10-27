import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';

export const getAllPrestadores = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT idobra_social, Financiador, activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real FROM financiador ORDER BY Financiador'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching prestadores:', err);
    res.status(500).json({ error: 'Error al obtener prestadores' });
  }
};

export const updatePrestador = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE financiador SET activo = ?, tasa_mensual = ?, dias_cobranza_teorico = ?, dias_cobranza_real = ? WHERE idobra_social = ?',
      [activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Prestador no encontrado' });
    }

    res.json({ message: 'Prestador actualizado correctamente' });
  } catch (err) {
    console.error('Error updating prestador:', err);
    res.status(500).json({ error: 'Error al actualizar prestador' });
  }
};