import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';

export const getAllSucursales = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT ID, Sucursales_mh, suc_porcentaje_dificil_acceso, suc_porcentaje_insumos FROM sucursales_mh ORDER BY Sucursales_mh'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching sucursales:', err);
    res.status(500).json({ error: 'Error al obtener sucursales' });
  }
};

export const updateSucursal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { suc_porcentaje_dificil_acceso, suc_porcentaje_insumos } = req.body;

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE sucursales_mh SET suc_porcentaje_dificil_acceso = ?, suc_porcentaje_insumos = ? WHERE ID = ?',
      [suc_porcentaje_dificil_acceso, suc_porcentaje_insumos, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada' });
    }

    res.json({ message: 'Sucursal actualizada correctamente' });
  } catch (err) {
    console.error('Error updating sucursal:', err);
    res.status(500).json({ error: 'Error al actualizar sucursal' });
  }
};