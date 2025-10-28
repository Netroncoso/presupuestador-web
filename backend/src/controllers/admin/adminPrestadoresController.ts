import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';

export const getAllPrestadores = async (req: Request, res: Response) => {
  try {
    // Return financiador data along with associated acuerdo name (if any)
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT f.idobra_social, f.Financiador, f.activo, f.tasa_mensual, f.dias_cobranza_teorico, f.dias_cobranza_real, f.id_acuerdo, COALESCE(a.nombre, NULL) as acuerdo_nombre
       FROM financiador f
       LEFT JOIN financiador_acuerdo a ON f.id_acuerdo = a.id_acuerdo
       ORDER BY f.Financiador`
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
    const { activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id_acuerdo } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE financiador SET activo = ?, tasa_mensual = ?, dias_cobranza_teorico = ?, dias_cobranza_real = ?, id_acuerdo = ? WHERE idobra_social = ?',
      [activo, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real, id_acuerdo ?? null, id]
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

// Return list of acuerdos available for financiadores
export const getAcuerdos = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT id_acuerdo, nombre FROM financiador_acuerdo ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching financiador acuerdos:', err);
    res.status(500).json({ error: 'Error al obtener acuerdos de financiador' });
  }
};