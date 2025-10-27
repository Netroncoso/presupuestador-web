import { Request, Response } from 'express';
import { pool } from '../db';

export const guardarPrestacionPresupuesto = async (req: Request, res: Response) => {
  try {
    const presupuestoId = parseInt(req.params.id);
    const { id_servicio, prestacion, cantidad, valor_asignado } = req.body;

    if (isNaN(presupuestoId) || !id_servicio || !prestacion || !cantidad || !valor_asignado) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    await pool.query(
      'INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE prestacion = VALUES(prestacion), cantidad = VALUES(cantidad), valor_asignado = VALUES(valor_asignado)',
      [presupuestoId, id_servicio, prestacion, cantidad, valor_asignado]
    );

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error saving prestacion:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al guardar prestación', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const eliminarPrestacionPresupuesto = async (req: Request, res: Response) => {
  try {
    const presupuestoId = parseInt(req.params.id);
    const { id_servicio } = req.body;

    if (isNaN(presupuestoId) || !id_servicio) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    await pool.query(
      'DELETE FROM presupuesto_prestaciones WHERE idPresupuestos = ? AND id_servicio = ?',
      [presupuestoId, id_servicio]
    );

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting prestacion:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al eliminar prestación', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const obtenerPrestacionesPresupuesto = async (req: Request, res: Response) => {
  try {
    const presupuestoId = parseInt(req.params.id);

    if (isNaN(presupuestoId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const [rows] = await pool.query(
      'SELECT id_servicio, prestacion, cantidad, valor_asignado FROM presupuesto_prestaciones WHERE idPresupuestos = ?',
      [presupuestoId]
    );

    res.json(rows);
  } catch (err: any) {
    console.error('Error fetching prestaciones:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al obtener prestaciones', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};