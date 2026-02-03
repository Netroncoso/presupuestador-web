// ============================================================================
// CONTROLLER: PRESTACIONES TARIFARIO EN PRESUPUESTOS
// ============================================================================

import { Request, Response } from 'express';
import { pool } from '../db';
import { PresupuestoPrestacionTarifario, CrearPrestacionTarifarioDTO } from '../types/tarifario';
import { RowDataPacket } from 'mysql2';

// Listar prestaciones del tarifario de un presupuesto
export const listarPrestacionesTarifario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [prestaciones] = await pool.query<PresupuestoPrestacionTarifario[]>(
      `SELECT ppt.*, ts.nombre as servicio_nombre, z.nombre as zona_nombre
       FROM presupuesto_prestaciones_tarifario ppt
       INNER JOIN tarifario_servicio ts ON ppt.tarifario_servicio_id = ts.id
       INNER JOIN tarifario_zonas z ON ppt.zona_id = z.id
       WHERE ppt.idPresupuestos = ?
       ORDER BY ppt.created_at`,
      [id]
    );
    
    res.json(prestaciones);
  } catch (error) {
    console.error('Error al listar prestaciones tarifario:', error);
    res.status(500).json({ error: 'Error al listar prestaciones' });
  }
};

// Agregar prestación del tarifario
export const agregarPrestacionTarifario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tarifario_servicio_id, cantidad, zona_id, orden_costo, valor_asignado, fuera_tarifario }: CrearPrestacionTarifarioDTO = req.body;
    
    // Validaciones
    if (!tarifario_servicio_id || !cantidad || !zona_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // Si no es fuera de tarifario, orden_costo es requerido
    if (!fuera_tarifario && !orden_costo) {
      return res.status(400).json({ error: 'orden_costo es requerido' });
    }
    
    if (orden_costo && (orden_costo < 1 || orden_costo > 5)) {
      return res.status(400).json({ error: 'orden_costo debe estar entre 1 y 5' });
    }
    
    // Obtener nombre del servicio
    const [servicio] = await pool.query<RowDataPacket[]>(
      'SELECT nombre FROM tarifario_servicio WHERE id = ?',
      [tarifario_servicio_id]
    );
    
    if (servicio.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    // Obtener costo del tarifario o usar valor manual
    let costoFinal: number;
    let fueraTarifarioFlag = 0;
    let ordenFinal = orden_costo || 0;
    
    if (fuera_tarifario && valor_asignado !== undefined) {
      // Usuario editó manualmente
      costoFinal = valor_asignado;
      fueraTarifarioFlag = 1;
    } else if (valor_asignado !== undefined) {
      // Valor manual sin flag (compatibilidad)
      costoFinal = valor_asignado;
      fueraTarifarioFlag = 1;
    } else {
      // Obtener del tarifario según orden
      const [valores] = await pool.query<RowDataPacket[]>(
        `SELECT costo_${orden_costo} as costo
         FROM tarifario_servicio_valores
         WHERE tarifario_servicio_id = ? 
           AND zona_id = ?
           AND CURDATE() BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
         LIMIT 1`,
        [tarifario_servicio_id, zona_id]
      );
      
      if (valores.length === 0) {
        return res.status(404).json({ error: 'No hay valores vigentes para esta zona' });
      }
      
      costoFinal = valores[0].costo;
    }
    
    // Obtener markup
    const [config] = await pool.query<RowDataPacket[]>(
      'SELECT valor FROM configuracion_sistema WHERE clave = ?',
      ['markup_tarifario']
    );
    const markup = config.length > 0 ? parseFloat(config[0].valor) : 50.00;
    
    // Calcular valor a facturar
    const valorFacturar = costoFinal * (1 + markup / 100);
    
    // Insertar prestación
    const [result] = await pool.query(
      `INSERT INTO presupuesto_prestaciones_tarifario 
       (idPresupuestos, tarifario_servicio_id, prestacion, cantidad, zona_id, orden_costo, valor_asignado, valor_facturar, fuera_tarifario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tarifario_servicio_id, servicio[0].nombre, cantidad, zona_id, ordenFinal, costoFinal, valorFacturar, fueraTarifarioFlag]
    );
    
    // Recalcular totales del presupuesto
    await recalcularTotales(parseInt(id));
    
    res.status(201).json({
      id: (result as any).insertId,
      message: 'Prestación agregada exitosamente',
      fuera_tarifario: fueraTarifarioFlag === 1,
      requiere_autorizacion: ordenFinal === 5
    });
  } catch (error) {
    console.error('Error al agregar prestación tarifario:', error);
    res.status(500).json({ error: 'Error al agregar prestación' });
  }
};

// Eliminar prestación del tarifario
export const eliminarPrestacionTarifario = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    
    await pool.query(
      'DELETE FROM presupuesto_prestaciones_tarifario WHERE id = ? AND idPresupuestos = ?',
      [itemId, id]
    );
    
    // Recalcular totales
    await recalcularTotales(parseInt(id));
    
    res.json({ message: 'Prestación eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar prestación tarifario:', error);
    res.status(500).json({ error: 'Error al eliminar prestación' });
  }
};

// Actualizar prestación del tarifario
export const actualizarPrestacionTarifario = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const { cantidad, valor_asignado } = req.body;
    
    if (!cantidad || !valor_asignado) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    // Obtener prestación actual
    const [actual] = await pool.query<PresupuestoPrestacionTarifario[]>(
      'SELECT * FROM presupuesto_prestaciones_tarifario WHERE id = ?',
      [itemId]
    );
    
    if (actual.length === 0) {
      return res.status(404).json({ error: 'Prestación no encontrada' });
    }
    
    // Verificar si el valor cambió (solo marcar fuera_tarifario si cambió el costo)
    const valorCambio = Math.abs(parseFloat(actual[0].valor_asignado.toString()) - parseFloat(valor_asignado.toString())) > 0.01;
    const fueraTarifario = valorCambio ? 1 : actual[0].fuera_tarifario;
    
    // Obtener markup
    const [config] = await pool.query<RowDataPacket[]>(
      'SELECT valor FROM configuracion_sistema WHERE clave = ?',
      ['markup_tarifario']
    );
    const markup = config.length > 0 ? parseFloat(config[0].valor) : 50.00;
    
    // Calcular nuevo valor a facturar
    const valorFacturar = valor_asignado * (1 + markup / 100);
    
    // Actualizar prestación
    await pool.query(
      `UPDATE presupuesto_prestaciones_tarifario 
       SET cantidad = ?, valor_asignado = ?, valor_facturar = ?, fuera_tarifario = ?
       WHERE id = ? AND idPresupuestos = ?`,
      [cantidad, valor_asignado, valorFacturar, fueraTarifario, itemId, id]
    );
    
    // Recalcular totales
    await recalcularTotales(parseInt(id));
    
    // Devolver prestación actualizada
    const [updated] = await pool.query<PresupuestoPrestacionTarifario[]>(
      `SELECT ppt.*, ts.nombre as servicio_nombre, z.nombre as zona_nombre
       FROM presupuesto_prestaciones_tarifario ppt
       INNER JOIN tarifario_servicio ts ON ppt.tarifario_servicio_id = ts.id
       INNER JOIN tarifario_zonas z ON ppt.zona_id = z.id
       WHERE ppt.id = ?`,
      [itemId]
    );
    
    res.json({ message: 'Prestación actualizada exitosamente', prestacion: updated[0] });
  } catch (error) {
    console.error('Error al actualizar prestación tarifario:', error);
    res.status(500).json({ error: 'Error al actualizar prestación' });
  }
};

// Helper: Recalcular totales del presupuesto
async function recalcularTotales(presupuestoId: number): Promise<void> {
  // Sumar prestaciones de convenio
  const [convenio] = await pool.query<RowDataPacket[]>(
    'SELECT COALESCE(SUM(valor_facturar * cantidad), 0) as total FROM presupuesto_prestaciones WHERE idPresupuestos = ?',
    [presupuestoId]
  );
  
  // Sumar prestaciones de tarifario
  const [tarifario] = await pool.query<RowDataPacket[]>(
    'SELECT COALESCE(SUM(valor_facturar * cantidad), 0) as total FROM presupuesto_prestaciones_tarifario WHERE idPresupuestos = ?',
    [presupuestoId]
  );
  
  const totalPrestaciones = parseFloat(convenio[0].total) + parseFloat(tarifario[0].total);
  
  // Actualizar total_prestaciones
  await pool.query(
    'UPDATE presupuestos SET total_prestaciones = ? WHERE idPresupuestos = ?',
    [totalPrestaciones, presupuestoId]
  );
}
