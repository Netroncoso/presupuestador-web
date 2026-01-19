import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../../db';
import { cacheService } from '../../services/cacheService';

export const getAllServicios = async (req: Request, res: Response) => {
  try {
    const cacheKey = 'catalogos:servicios';
    const cached = cacheService.get(cacheKey);
    if (cached) return res.json(cached);
    
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id_servicio, nombre, tipo_unidad, max_unidades_sugerido FROM servicios ORDER BY nombre'
    );
    cacheService.set(cacheKey, rows, 1800); // 30 min
    res.json(rows);
  } catch (err) {
    console.error('Error fetching servicios:', err);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
};

export const createServicio = async (req: Request, res: Response) => {
  try {
    const { nombre, tipo_unidad, max_unidades_sugerido } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO servicios (nombre, tipo_unidad, max_unidades_sugerido) VALUES (?, ?, ?)',
      [nombre, tipo_unidad, max_unidades_sugerido || null]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      tipo_unidad,
      max_unidades_sugerido,
      message: 'Servicio creado correctamente'
    });
    
    cacheService.invalidateCatalogos();
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El servicio ya existe' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Tipo de unidad no válido' });
    }
    console.error('Error creating servicio:', err);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

export const updateServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, tipo_unidad, max_unidades_sugerido } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE servicios SET nombre = ?, tipo_unidad = ?, max_unidades_sugerido = ? WHERE id_servicio = ?',
      [nombre, tipo_unidad, max_unidades_sugerido || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ message: 'Servicio actualizado correctamente' });
    cacheService.invalidateCatalogos();
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El servicio ya existe' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Tipo de unidad no válido' });
    }
    console.error('Error updating servicio:', err);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

export const deleteServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM servicios WHERE id_servicio = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ message: 'Servicio eliminado correctamente' });
    cacheService.invalidateCatalogos();
  } catch (err) {
    console.error('Error deleting servicio:', err);
    res.status(500).json({ error: 'Error al eliminar servicio' });
  }
};
