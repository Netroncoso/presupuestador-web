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

export const guardarVersion = async (req: Request, res: Response) => {
  try {
    const idOriginal = parseInt(req.params.id);
    console.log('Guardando versión del presupuesto:', idOriginal);
    
    if (isNaN(idOriginal) || idOriginal <= 0) {
      return res.status(400).json({ error: 'ID de presupuesto inválido' });
    }

    const [presupuestoOriginal]: any = await pool.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [idOriginal]
    );

    if (presupuestoOriginal.length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    const original = presupuestoOriginal[0];
    const { total_insumos, total_prestaciones, costo_total, total_facturar, rentabilidad } = req.body;
    console.log('Datos recibidos:', { total_insumos, total_prestaciones, costo_total, total_facturar, rentabilidad });
    console.log('Datos originales:', { nombre: original.Nombre_Apellido, dni: original.DNI, sucursal: original.Sucursal });

    const [resultPresupuesto]: any = await pool.query(
      'INSERT INTO presupuestos (Nombre_Apellido, DNI, Sucursal, dificil_acceso, idobra_social, total_insumos, total_prestaciones, costo_total, total_facturar, rentabilidad) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [
        original.Nombre_Apellido,
        original.DNI,
        original.Sucursal,
        original.dificil_acceso || 'no',
        original.idobra_social || null,
        total_insumos || 0,
        total_prestaciones || 0,
        costo_total || 0,
        total_facturar || 0,
        rentabilidad || 0
      ]
    );

    const nuevoId = resultPresupuesto.insertId;

    const [insumos]: any = await pool.query(
      'SELECT * FROM presupuesto_insumos WHERE idPresupuestos = ?',
      [idOriginal]
    );

    for (const insumo of insumos) {
      await pool.query(
        'INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, cantidad) VALUES (?,?,?,?)',
        [nuevoId, insumo.producto, insumo.costo, insumo.cantidad]
      );
    }

    const [prestaciones]: any = await pool.query(
      'SELECT * FROM presupuesto_prestaciones WHERE idPresupuestos = ?',
      [idOriginal]
    );

    for (const prestacion of prestaciones) {
      await pool.query(
        'INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado) VALUES (?,?,?,?,?)',
        [nuevoId, prestacion.id_servicio, prestacion.prestacion, prestacion.cantidad, prestacion.valor_asignado]
      );
    }

    console.log('Nueva versión creada con ID:', nuevoId);
    res.status(201).json({ id: nuevoId });
  } catch (err: any) {
    console.error('Error guardando versión:', err);
    console.error('Stack trace:', err.stack);
    res.status(500).json({ error: 'Error al guardar versión del presupuesto', details: err.message });
  }
};
