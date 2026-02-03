// ============================================================================
// CONTROLLER: ZONAS TARIFARIO
// ============================================================================

import { Request, Response } from 'express';
import { pool } from '../db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Listar todas las zonas
export const listarZonas = async (req: Request, res: Response) => {
  try {
    const [zonas] = await pool.query<RowDataPacket[]>(
      `SELECT z.*, 
        GROUP_CONCAT(DISTINCT s.Sucursales_mh ORDER BY s.Sucursales_mh SEPARATOR ', ') as sucursales,
        GROUP_CONCAT(DISTINCT CASE WHEN sz.es_zona_principal = 1 THEN s.Sucursales_mh END ORDER BY s.Sucursales_mh SEPARATOR ', ') as sucursales_principales
       FROM tarifario_zonas z
       LEFT JOIN sucursales_tarifario_zonas sz ON z.id = sz.zona_id
       LEFT JOIN sucursales_mh s ON sz.sucursal_id = s.ID
       GROUP BY z.id
       ORDER BY z.nombre`
    );
    res.json(zonas);
  } catch (error) {
    console.error('Error al listar zonas:', error);
    res.status(500).json({ error: 'Error al listar zonas' });
  }
};

// Crear zona
export const crearZona = async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'Nombre es requerido' });
    }
    
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO tarifario_zonas (nombre, descripcion) VALUES (?, ?)',
      [nombre.trim(), descripcion?.trim() || null]
    );
    
    res.status(201).json({ id: result.insertId, mensaje: 'Zona creada exitosamente' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya existe una zona con ese nombre' });
    }
    console.error('Error al crear zona:', error);
    res.status(500).json({ error: 'Error al crear zona' });
  }
};

// Actualizar zona
export const actualizarZona = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE tarifario_zonas SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
      [nombre, descripcion, activo, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Zona no encontrada' });
    }
    
    res.json({ mensaje: 'Zona actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar zona:', error);
    res.status(500).json({ error: 'Error al actualizar zona' });
  }
};

// Obtener zonas de una sucursal
export const obtenerZonasPorSucursal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [zonas] = await pool.query<RowDataPacket[]>(
      `SELECT z.*, sz.es_zona_principal
       FROM tarifario_zonas z
       INNER JOIN sucursales_tarifario_zonas sz ON z.id = sz.zona_id
       WHERE sz.sucursal_id = ? AND z.activo = 1
       ORDER BY sz.es_zona_principal DESC, z.nombre`,
      [id]
    );
    
    res.json(zonas);
  } catch (error) {
    console.error('Error al obtener zonas de sucursal:', error);
    res.status(500).json({ error: 'Error al obtener zonas' });
  }
};

// Asignar zona a sucursal
export const asignarZonaASucursal = async (req: Request, res: Response) => {
  try {
    const { id, zonaId } = req.params;
    const { es_zona_principal } = req.body;
    
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Si es zona principal, quitar flag de otras zonas
      if (es_zona_principal) {
        await connection.query(
          'UPDATE sucursales_tarifario_zonas SET es_zona_principal = 0 WHERE sucursal_id = ?',
          [id]
        );
      }
      
      // Insertar o actualizar
      await connection.query(
        `INSERT INTO sucursales_tarifario_zonas (sucursal_id, zona_id, es_zona_principal)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE es_zona_principal = VALUES(es_zona_principal)`,
        [id, zonaId, es_zona_principal ? 1 : 0]
      );
      
      await connection.commit();
      res.json({ mensaje: 'Zona asignada exitosamente' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al asignar zona:', error);
    res.status(500).json({ error: 'Error al asignar zona' });
  }
};

// Desasignar zona de sucursal
export const desasignarZonaDeSucursal = async (req: Request, res: Response) => {
  try {
    const { id, zonaId } = req.params;
    
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM sucursales_tarifario_zonas WHERE sucursal_id = ? AND zona_id = ?',
      [id, zonaId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada' });
    }
    
    res.json({ mensaje: 'Zona desasignada exitosamente' });
  } catch (error) {
    console.error('Error al desasignar zona:', error);
    res.status(500).json({ error: 'Error al desasignar zona' });
  }
};
