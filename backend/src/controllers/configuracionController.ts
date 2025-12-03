import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { ConfiguracionSistema, MutationResult } from '../types/database';

export const obtenerConfiguracion = asyncHandler(async (req: Request, res: Response) => {
  const { categoria } = req.query;
  
  let query = 'SELECT * FROM configuracion_sistema';
  const params: any[] = [];
  
  if (categoria) {
    query += ' WHERE categoria = ?';
    params.push(categoria);
  }
  
  query += ' ORDER BY categoria, clave';
  
  const [rows] = await pool.query<ConfiguracionSistema[]>(query, params);
  res.json(rows);
});

export const actualizarConfiguracion = asyncHandler(async (req: Request, res: Response) => {
  const { clave, valor } = req.body;

  if (!clave || valor === undefined) {
    throw new AppError(400, 'Clave y valor son requeridos');
  }

  const [result] = await pool.query<MutationResult>(
    'UPDATE configuracion_sistema SET valor = ? WHERE clave = ?',
    [valor, clave]
  );

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Configuración no encontrada');
  }

  res.json({ ok: true, mensaje: 'Configuración actualizada' });
});

export const actualizarMultiple = asyncHandler(async (req: Request, res: Response) => {
  const { configuraciones } = req.body;

  if (!Array.isArray(configuraciones)) {
    throw new AppError(400, 'Se esperaba un array de configuraciones');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const config of configuraciones) {
      await connection.query(
        'UPDATE configuracion_sistema SET valor = ? WHERE clave = ?',
        [config.valor, config.clave]
      );
    }

    await connection.commit();
    res.json({ ok: true, mensaje: 'Configuraciones actualizadas' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
