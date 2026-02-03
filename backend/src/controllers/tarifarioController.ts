// ============================================================================
// CONTROLLER: TARIFARIO SERVICIOS
// ============================================================================

import { Request, Response } from 'express';
import { pool } from '../db';
import { TarifarioServicio, TarifarioServicioValor, ValorVigenteDTO } from '../types/tarifario';
import { RowDataPacket } from 'mysql2';

// Listar servicios activos
export const listarServiciosActivos = async (req: Request, res: Response) => {
  try {
    const { zona_id } = req.query;
    
    const [servicios] = await pool.query<TarifarioServicio[]>(
      'SELECT * FROM tarifario_servicio WHERE activo = 1 ORDER BY nombre'
    );
    
    // Si se proporciona zona_id, incluir valores vigentes
    if (zona_id) {
      const serviciosConValores = await Promise.all(
        servicios.map(async (servicio) => {
          const [valores] = await pool.query<TarifarioServicioValor[]>(
            `SELECT * FROM tarifario_servicio_valores 
             WHERE tarifario_servicio_id = ? 
               AND zona_id = ?
               AND CURDATE() BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
             ORDER BY fecha_inicio DESC
             LIMIT 1`,
            [servicio.id, zona_id]
          );
          
          if (valores.length === 0) {
            return { ...servicio, valores: null };
          }
          
          const valor = valores[0];
          const diasDesactualizacion = await calcularDiasDesactualizacion(valor.fecha_inicio);
          
          return {
            ...servicio,
            valores: [
              { orden: 1, costo: valor.costo_1, dias_desactualizacion: diasDesactualizacion },
              { orden: 2, costo: valor.costo_2, dias_desactualizacion: diasDesactualizacion },
              { orden: 3, costo: valor.costo_3, dias_desactualizacion: diasDesactualizacion },
              { orden: 4, costo: valor.costo_4, dias_desactualizacion: diasDesactualizacion },
              { orden: 5, costo: valor.costo_5, dias_desactualizacion: diasDesactualizacion }
            ]
          };
        })
      );
      
      return res.json(serviciosConValores);
    }
    
    res.json(servicios);
  } catch (error) {
    console.error('Error al listar servicios:', error);
    res.status(500).json({ error: 'Error al listar servicios' });
  }
};

// Obtener valores vigentes por servicio y zona
export const obtenerValoresVigentes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { zona_id } = req.query;
    
    if (!zona_id) {
      return res.status(400).json({ error: 'zona_id es requerido' });
    }
    
    const [valores] = await pool.query<TarifarioServicioValor[]>(
      `SELECT * FROM tarifario_servicio_valores 
       WHERE tarifario_servicio_id = ? 
         AND zona_id = ?
         AND CURDATE() BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
       ORDER BY fecha_inicio DESC
       LIMIT 1`,
      [id, zona_id]
    );
    
    if (valores.length === 0) {
      return res.status(404).json({ error: 'No hay valores vigentes para esta zona' });
    }
    
    const valor = valores[0];
    const diasDesactualizacion = await calcularDiasDesactualizacion(valor.fecha_inicio);
    
    // Construir array de 5 valores con alertas
    const valoresDTO: ValorVigenteDTO[] = [
      {
        orden: 1,
        costo: valor.costo_1,
        dias_desactualizacion: diasDesactualizacion,
        alerta_desactualizado: diasDesactualizacion > 45
      },
      {
        orden: 2,
        costo: valor.costo_2,
        dias_desactualizacion: diasDesactualizacion,
        alerta_desactualizado: diasDesactualizacion > 45
      },
      {
        orden: 3,
        costo: valor.costo_3,
        dias_desactualizacion: diasDesactualizacion,
        alerta_desactualizado: diasDesactualizacion > 45
      },
      {
        orden: 4,
        costo: valor.costo_4,
        dias_desactualizacion: diasDesactualizacion,
        alerta_desactualizado: diasDesactualizacion > 45
      },
      {
        orden: 5,
        costo: valor.costo_5,
        dias_desactualizacion: diasDesactualizacion,
        alerta_desactualizado: diasDesactualizacion > 45
      }
    ];
    
    res.json({
      servicio_id: parseInt(id),
      zona_id: parseInt(zona_id as string),
      fecha_inicio: valor.fecha_inicio,
      valores: valoresDTO
    });
  } catch (error) {
    console.error('Error al obtener valores vigentes:', error);
    res.status(500).json({ error: 'Error al obtener valores vigentes' });
  }
};

// Obtener markup configurado
export const obtenerMarkup = async (req: Request, res: Response) => {
  try {
    const [config] = await pool.query<RowDataPacket[]>(
      'SELECT valor FROM configuracion_sistema WHERE clave = ?',
      ['markup_tarifario']
    );
    
    if (config.length === 0) {
      return res.json({ markup: 50.00 }); // Default
    }
    
    res.json({ markup: parseFloat(config[0].valor) });
  } catch (error) {
    console.error('Error al obtener markup:', error);
    res.status(500).json({ error: 'Error al obtener markup' });
  }
};

// Helper: Calcular días desde última actualización
async function calcularDiasDesactualizacion(fechaInicio: Date): Promise<number> {
  const [result] = await pool.query<RowDataPacket[]>(
    'SELECT DATEDIFF(CURDATE(), ?) as dias',
    [fechaInicio]
  );
  return result[0].dias;
}
