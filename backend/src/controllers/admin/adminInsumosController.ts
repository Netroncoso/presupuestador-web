import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';
import { asyncHandler, AppError } from '../../middleware/errorHandler';

export const getAllInsumos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT idInsumos, producto, costo, codigo_producto FROM insumos ORDER BY producto'
  );
  res.json(rows);
});

export const createInsumo = asyncHandler(async (req: Request, res: Response) => {
  const { producto, costo, codigo_producto } = req.body;

  if (!producto || costo === undefined) {
    throw new AppError(400, 'Producto y costo son requeridos');
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO insumos (producto, costo, codigo_producto) VALUES (?, ?, ?)',
      [producto, costo, codigo_producto || null]
    );

    res.status(201).json({
      id: result.insertId,
      producto,
      costo,
      codigo_producto,
      message: 'Insumo creado correctamente'
    });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'El producto ya existe');
    }
    throw err;
  }
});

export const updateInsumo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { producto, costo, codigo_producto } = req.body;

  if (!producto || costo === undefined) {
    throw new AppError(400, 'Producto y costo son requeridos');
  }

  try {
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE insumos SET producto = ?, costo = ?, codigo_producto = ? WHERE idInsumos = ?',
      [producto, costo, codigo_producto || null, id]
    );

    if (result.affectedRows === 0) {
      throw new AppError(404, 'Insumo no encontrado');
    }

    res.json({ message: 'Insumo actualizado correctamente' });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'El producto ya existe');
    }
    throw err;
  }
});

export const deleteInsumo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const [result] = await pool.query<ResultSetHeader>(
    'DELETE FROM insumos WHERE idInsumos = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Insumo no encontrado');
  }

  res.json({ message: 'Insumo eliminado correctamente' });
});