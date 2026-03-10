// ============================================================================
// CONTROLLER: TARIFARIO ADMIN
// ============================================================================

import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ============================================================================
// SERVICIOS
// ============================================================================

export const listarServicios = async (req: Request, res: Response) => {
  try {
    const [servicios] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM servicios ORDER BY nombre'
    );
    res.json(servicios);
  } catch (error) {
    console.error('Error al listar servicios:', error);
    res.status(500).json({ error: 'Error al listar servicios' });
  }
};

export const crearServicio = async (req: Request, res: Response) => {
  try {
    const { nombre, tipo_unidad, codigo_financiador } = req.body;
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO servicios (nombre, tipo_unidad, codigo_financiador) VALUES (?, ?, ?)',
      [nombre, tipo_unidad, codigo_financiador || null]
    );
    
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al crear servicio' });
  }
};

export const actualizarServicio = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, tipo_unidad, codigo_financiador } = req.body;
    
    await pool.query(
      'UPDATE servicios SET nombre = ?, tipo_unidad = ?, codigo_financiador = ? WHERE id = ?',
      [nombre, tipo_unidad, codigo_financiador || null, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({ error: 'Error al actualizar servicio' });
  }
};

export const toggleActivo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    await pool.query(
      'UPDATE servicios SET activo = ? WHERE id = ?',
      [activo ? 1 : 0, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// ============================================================================
// VALORES POR ZONA
// ============================================================================

export const listarServiciosConValores = async (req: Request, res: Response) => {
  try {
    const { zonaId } = req.params;
    const incluirSinValores = req.query.incluir_sin_valores === 'true';
    
    let query: string;
    
    if (incluirSinValores) {
      // Mostrar TODOS los servicios (con o sin valores)
      query = `SELECT 
        s.id,
        s.nombre,
        s.tipo_unidad,
        s.activo,
        tsv.costo_1,
        tsv.costo_2,
        tsv.costo_3,
        tsv.costo_4,
        tsv.costo_5,
        CASE WHEN tsv.id IS NOT NULL THEN 1 ELSE 0 END as tiene_valores
      FROM servicios s
      LEFT JOIN tarifario_servicio_valores tsv ON s.id = tsv.servicio_id 
        AND tsv.zona_tarifario_id = ?
        AND CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31')
      ORDER BY s.nombre`;
    } else {
      // Solo servicios que tienen valores configurados
      query = `SELECT 
        s.id,
        s.nombre,
        s.tipo_unidad,
        s.activo,
        tsv.costo_1,
        tsv.costo_2,
        tsv.costo_3,
        tsv.costo_4,
        tsv.costo_5,
        1 as tiene_valores
      FROM servicios s
      INNER JOIN tarifario_servicio_valores tsv ON s.id = tsv.servicio_id 
        AND tsv.zona_tarifario_id = ?
        AND CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31')
      ORDER BY s.nombre`;
    }
    
    const [servicios] = await pool.query<RowDataPacket[]>(query, [zonaId]);
    
    res.json(servicios);
  } catch (error) {
    console.error('Error al listar servicios con valores:', error);
    res.status(500).json({ error: 'Error al listar servicios con valores' });
  }
};

export const obtenerHistorico = async (req: Request, res: Response) => {
  try {
    const { servicioId, zonaId } = req.params;
    
    const [historico] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM tarifario_servicio_valores 
       WHERE servicio_id = ? AND zona_tarifario_id = ?
       ORDER BY fecha_inicio DESC`,
      [servicioId, zonaId]
    );
    
    res.json(historico);
  } catch (error) {
    console.error('Error al obtener histórico:', error);
    res.status(500).json({ error: 'Error al obtener histórico' });
  }
};

export const guardarValores = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  
  try {
    const { servicio_id, zona_tarifario_id, costo_1, costo_2, costo_3, costo_4, costo_5, fecha_inicio } = req.body;
    
    await connection.beginTransaction();
    
    // Cerrar período anterior
    await connection.query(
      `UPDATE tarifario_servicio_valores 
       SET fecha_fin = DATE_SUB(?, INTERVAL 1 DAY)
       WHERE servicio_id = ? 
         AND zona_tarifario_id = ?
         AND fecha_fin IS NULL`,
      [fecha_inicio, servicio_id, zona_tarifario_id]
    );
    
    // Insertar nuevos valores
    await connection.query(
      `INSERT INTO tarifario_servicio_valores 
       (servicio_id, zona_tarifario_id, costo_1, costo_2, costo_3, costo_4, costo_5, fecha_inicio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [servicio_id, zona_tarifario_id, costo_1, costo_2, costo_3, costo_4, costo_5, fecha_inicio]
    );
    
    await connection.commit();
    res.status(201).json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error('Error al guardar valores:', error);
    res.status(500).json({ error: 'Error al guardar valores' });
  } finally {
    connection.release();
  }
};
