import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const obtenerAlertasEquipamientos = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query(
    'SELECT * FROM tipos_equipamiento ORDER BY nombre'
  );
  res.json(rows);
});

export const actualizarAlertaEquipamiento = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta } = req.body;

  if (isNaN(id)) {
    throw new AppError(400, 'ID inválido');
  }

  const [result]: any = await pool.query(
    `UPDATE tipos_equipamiento 
     SET cantidad_maxima = ?, mensaje_alerta = ?, color_alerta = ?, activo_alerta = ?
     WHERE id = ?`,
    [cantidad_maxima, mensaje_alerta, color_alerta, activo_alerta, id]
  );

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Tipo no encontrado');
  }

  res.json({ ok: true, mensaje: 'Alerta actualizada' });
});
