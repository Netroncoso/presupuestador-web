import { Request, Response } from 'express';
import { pool } from '../db';

export const guardarInsumoPresupuesto = async (req: Request, res: Response) => {
  try {
    const presupuestoId = parseInt(req.params.id);
    const { producto, costo, cantidad } = req.body;

    if (isNaN(presupuestoId) || !producto || !costo || !cantidad) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    await pool.query(
      'INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, cantidad) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE costo = VALUES(costo), cantidad = VALUES(cantidad)',
      [presupuestoId, producto, costo, cantidad]
    );

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error saving insumo:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al guardar insumo', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const eliminarInsumoPresupuesto = async (req: Request, res: Response) => {
  try {
    const presupuestoId = parseInt(req.params.id);
    const { producto } = req.body;

    if (isNaN(presupuestoId) || !producto) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    await pool.query(
      'DELETE FROM presupuesto_insumos WHERE idPresupuestos = ? AND producto = ?',
      [presupuestoId, producto]
    );

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error deleting insumo:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al eliminar insumo', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const obtenerInsumosPresupuesto = async (req: Request, res: Response) => {
  try {
    const presupuestoId = parseInt(req.params.id);

    if (isNaN(presupuestoId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const [rows] = await pool.query(
      'SELECT producto, costo, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?',
      [presupuestoId]
    );

    res.json(rows);
  } catch (err: any) {
    console.error('Error fetching insumos:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al obtener insumos', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};