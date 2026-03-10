import { Router } from 'express';
import { pool } from '../db';
import { RowDataPacket } from 'mysql2';

const router = Router();

// GET /api/tarifario/servicios?zona_tarifario_id=1
router.get('/servicios', async (req, res) => {
  try {
    const { zona_tarifario_id } = req.query;
    
    if (!zona_tarifario_id) {
      return res.status(400).json({ error: 'zona_tarifario_id es requerido' });
    }
    
    const [servicios] = await pool.query<RowDataPacket[]>(`
      SELECT 
        s.id,
        s.nombre,
        s.tipo_unidad,
        tsv.costo_1,
        tsv.costo_2,
        tsv.costo_3,
        tsv.costo_4,
        tsv.costo_5
      FROM servicios s
      INNER JOIN tarifario_servicio_valores tsv ON s.id = tsv.servicio_id
      WHERE tsv.zona_tarifario_id = ?
        AND (tsv.fecha_fin IS NULL OR tsv.fecha_fin > NOW())
        AND tsv.fecha_inicio <= NOW()
      ORDER BY s.nombre
    `, [zona_tarifario_id]);
    
    // Formatear valores como array
    const serviciosFormateados = servicios.map((s: any) => ({
      id: s.id,
      nombre: s.nombre,
      tipo_unidad: s.tipo_unidad,
      valores: [s.costo_1, s.costo_2, s.costo_3, s.costo_4, s.costo_5].filter(v => v && v > 0)
    }));
    
    res.json({ servicios: serviciosFormateados });
  } catch (error) {
    console.error('Error obteniendo servicios tarifario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;