// ============================================================================
// CONTROLLER: ZONAS TARIFARIO
// ============================================================================

import { Request, Response } from 'express';
import { pool } from '../db';
import { TarifarioZona, SucursalTarifarioZona } from '../types/tarifario';

// Obtener zonas de una sucursal
export const obtenerZonasPorSucursal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const [zonas] = await pool.query<TarifarioZona[]>(
      `SELECT z.*, stz.es_zona_principal
       FROM tarifario_zonas z
       INNER JOIN sucursales_tarifario_zonas stz ON z.id = stz.zona_id
       WHERE stz.sucursal_id = ? AND z.activo = 1
       ORDER BY stz.es_zona_principal DESC, z.nombre`,
      [id]
    );
    
    res.json(zonas);
  } catch (error) {
    console.error('Error al obtener zonas:', error);
    res.status(500).json({ error: 'Error al obtener zonas' });
  }
};
