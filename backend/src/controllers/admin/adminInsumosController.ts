import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';

export const getAllInsumos = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT idInsumos, producto, costo FROM insumos ORDER BY producto'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching insumos:', err);
    res.status(500).json({ error: 'Error al obtener insumos' });
  }
};

export const createInsumo = async (req: Request, res: Response) => {
  try {
    const { producto, costo } = req.body;

    if (!producto || costo === undefined) {
      return res.status(400).json({ error: 'Producto y costo son requeridos' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO insumos (producto, costo) VALUES (?, ?)',
      [producto, costo]
    );

    res.status(201).json({
      id: result.insertId,
      producto,
      costo,
      message: 'Insumo creado correctamente'
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El producto ya existe' });
    }
    console.error('Error creating insumo:', err);
    res.status(500).json({ error: 'Error al crear insumo' });
  }
};

export const updateInsumo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { producto, costo } = req.body;

    if (!producto || costo === undefined) {
      return res.status(400).json({ error: 'Producto y costo son requeridos' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE insumos SET producto = ?, costo = ? WHERE idInsumos = ?',
      [producto, costo, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    res.json({ message: 'Insumo actualizado correctamente' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El producto ya existe' });
    }
    console.error('Error updating insumo:', err);
    res.status(500).json({ error: 'Error al actualizar insumo' });
  }
};

export const deleteInsumo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM insumos WHERE idInsumos = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    res.json({ message: 'Insumo eliminado correctamente' });
  } catch (err) {
    console.error('Error deleting insumo:', err);
    res.status(500).json({ error: 'Error al eliminar insumo' });
  }
};