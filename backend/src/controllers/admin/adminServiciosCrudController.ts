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
      'SELECT id, nombre, descripcion, tipo_unidad, activo FROM servicios WHERE activo = 1 ORDER BY nombre'
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
    const { nombre, descripcion, tipo_unidad } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO servicios (nombre, descripcion, tipo_unidad, activo) VALUES (?, ?, ?, 1)',
      [nombre, descripcion || null, tipo_unidad || null]
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      descripcion,
      tipo_unidad,
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
    const { nombre, descripcion, tipo_unidad, activo } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE servicios SET nombre = ?, descripcion = ?, tipo_unidad = ?, activo = ? WHERE id = ?',
      [nombre, descripcion || null, tipo_unidad || null, activo !== undefined ? activo : 1, id]
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

    // Soft delete
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE servicios SET activo = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    res.json({ message: 'Servicio desactivado correctamente' });
    cacheService.invalidateCatalogos();
  } catch (err) {
    console.error('Error deleting servicio:', err);
    res.status(500).json({ error: 'Error al desactivar servicio' });
  }
};
