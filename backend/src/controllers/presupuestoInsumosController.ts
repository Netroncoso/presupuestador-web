import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const guardarInsumoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { producto, costo, precio_facturar, cantidad } = req.body;

  if (isNaN(presupuestoId) || !producto || !costo || !cantidad) {
    throw new AppError(400, 'Datos inválidos');
  }

  // Si no se proporciona precio_facturar, usar costo como fallback (compatibilidad)
  const precioFinal = precio_facturar || costo;

  await pool.query(
    'INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, precio_facturar, cantidad) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE costo = VALUES(costo), precio_facturar = VALUES(precio_facturar), cantidad = VALUES(cantidad)',
    [presupuestoId, producto, costo, precioFinal, cantidad]
  );

  res.json({ ok: true });
});

export const eliminarInsumoPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);
  const { producto } = req.body;

  if (isNaN(presupuestoId) || !producto) {
    throw new AppError(400, 'Datos inválidos');
  }

  await pool.query(
    'DELETE FROM presupuesto_insumos WHERE idPresupuestos = ? AND producto = ?',
    [presupuestoId, producto]
  );

  res.json({ ok: true });
});

export const obtenerInsumosPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const presupuestoId = parseInt(req.params.id);

  if (isNaN(presupuestoId)) {
    throw new AppError(400, 'ID inválido');
  }

  const [rows] = await pool.query(
    'SELECT producto, costo, precio_facturar, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?',
    [presupuestoId]
  );

  res.json(rows);
});