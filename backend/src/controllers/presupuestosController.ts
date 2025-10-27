import { Request, Response } from 'express';
import { pool } from '../db';

const validatePresupuestoData = (data: any): string[] => {
  const { nombre, dni, sucursal } = data;
  const errors: string[] = [];
  
  if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
    errors.push('Nombre debe tener al menos 2 caracteres');
  }
  if (!dni || typeof dni !== 'string' || !/^\d{7,8}$/.test(dni)) {
    errors.push('DNI debe tener 7-8 dígitos');
  }
  if (!sucursal || typeof sucursal !== 'string') {
    errors.push('Sucursal es requerida');
  }
  
  return errors;
};

export const verificarDNI = async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;
    
    if (!dni || !/^\d{7,8}$/.test(dni)) {
      return res.status(400).json({ error: 'DNI debe tener 7-8 dígitos' });
    }

    const [rows]: any = await pool.query(
      'SELECT idPresupuestos, Nombre_Apellido, DNI, Sucursal, idobra_social, created_at FROM presupuestos WHERE DNI = ? ORDER BY created_at DESC LIMIT 1',
      [dni]
    );

    if (rows.length > 0) {
      res.json({ exists: true, presupuesto: rows[0] });
    } else {
      res.json({ exists: false });
    }
  } catch (err: any) {
    console.error('Error verificando DNI:', err);
    res.status(500).json({ error: 'Error al verificar DNI' });
  }
};

export const obtenerPresupuesto = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de presupuesto inválido' });
    }

    const [rows]: any = await pool.query(
      'SELECT idPresupuestos, Nombre_Apellido, DNI, Sucursal, idobra_social, dificil_acceso, created_at, updated_at FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    res.json(rows[0]);
  } catch (err: any) {
    console.error('Error obteniendo presupuesto:', err);
    res.status(500).json({ error: 'Error al obtener presupuesto' });
  }
};

export const crearPresupuesto = async (req: Request, res: Response) => {
  try {
    const validationErrors = validatePresupuestoData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const { nombre, dni, sucursal, dificil_acceso } = req.body;
    const [result]: any = await pool.query(
      'INSERT INTO presupuestos (Nombre_Apellido, DNI, Sucursal, dificil_acceso) VALUES (?,?,?,?)',
      [nombre.trim(), dni, sucursal, dificil_acceso || 'no']
    );

    const id = result.insertId;
    res.status(201).json({ id });
  } catch (err: any) {
    console.error('Error creating presupuesto:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un presupuesto con este DNI' });
    }
    res.status(500).json({ error: 'Error al crear presupuesto' });
  }
};

const validateTotalesData = (data: any): string[] => {
  const { total_insumos, total_prestaciones } = data;
  const errors: string[] = [];
  
  if (typeof total_insumos !== 'number' || total_insumos < 0) {
    errors.push('Total insumos debe ser un número positivo');
  }
  if (typeof total_prestaciones !== 'number' || total_prestaciones < 0) {
    errors.push('Total prestaciones debe ser un número positivo');
  }
  
  return errors;
};

export const actualizarTotales = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de presupuesto inválido' });
    }

    const validationErrors = validateTotalesData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(', ') });
    }

    const { total_insumos, total_prestaciones } = req.body;
    const costo_total = Number(total_insumos) + Number(total_prestaciones);
    
    const [result]: any = await pool.query(
      'UPDATE presupuestos SET total_insumos = ?, total_prestaciones = ?, costo_total = ? WHERE idPresupuestos = ?',
      [Number(total_insumos), Number(total_prestaciones), costo_total, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error updating totales:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al actualizar totales', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};

export const actualizarPrestador = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    console.log('Updating prestador for presupuesto ID:', id);
    
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID de presupuesto inválido' });
    }

    const { idobra_social } = req.body;
    console.log('idobra_social received:', idobra_social);
    
    if (!idobra_social) {
      return res.status(400).json({ error: 'ID de obra social es requerido' });
    }

    const [result]: any = await pool.query(
      'UPDATE presupuestos SET idobra_social = ? WHERE idPresupuestos = ?',
      [idobra_social, id]
    );

    console.log('Update result:', result);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error('Error updating prestador:', err instanceof Error ? err.message : 'Unknown error');
    res.status(500).json({ error: 'Error al actualizar prestador', details: err instanceof Error ? err.message : 'Unknown error' });
  }
};
