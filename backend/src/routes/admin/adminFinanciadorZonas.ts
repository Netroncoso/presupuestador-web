import { Router, Request, Response } from 'express';
import { pool } from '../../db';
import { authenticateToken, requireAdmin } from '../../middleware/auth';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const router = Router();

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/financiador-zonas - Obtener todas las zonas
router.get('/financiador-zonas', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const offset = (page - 1) * limit;

    let queryStr = 'SELECT * FROM financiador_zonas WHERE activo = 1';
    const params: any[] = [];

    if (search) {
      queryStr += ' AND nombre LIKE ?';
      params.push(`%${search}%`);
    }

    queryStr += ' ORDER BY nombre LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [zonas] = await pool.query(queryStr, params);

    let countQuery = 'SELECT COUNT(*) as total FROM financiador_zonas WHERE activo = 1';
    const countParams: any[] = [];

    if (search) {
      countQuery += ' AND nombre LIKE ?';
      countParams.push(`%${search}%`);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      data: zonas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo zonas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/financiador-zonas - Crear nueva zona
router.post('/financiador-zonas', async (req: Request, res: Response) => {
  try {
    const { nombre, descripcion } = req.body;
    
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const [result] = await pool.query<ResultSetHeader>(`
      INSERT INTO financiador_zonas (nombre, descripcion, activo)
      VALUES (?, ?, 1)
    `, [nombre.trim(), descripcion?.trim() || null]);
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Zona creada correctamente' 
    });
  } catch (error) {
    console.error('Error creando zona:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /api/admin/financiador-zonas/:id - Actualizar zona
router.put('/financiador-zonas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    
    if (!nombre?.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    await pool.query(`
      UPDATE financiador_zonas 
      SET nombre = ?, descripcion = ?, activo = ?
      WHERE id = ?
    `, [nombre.trim(), descripcion?.trim() || null, activo ?? 1, id]);
    
    res.json({ message: 'Zona actualizada correctamente' });
  } catch (error) {
    console.error('Error actualizando zona:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/admin/financiador-zonas/:id - Eliminar zona
router.delete('/financiador-zonas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar si la zona está en uso
    const [enUso] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count 
      FROM financiador_servicio_valores 
      WHERE zona_financiador_id = ?
    `, [id]);
    
    if (enUso[0]?.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la zona porque tiene valores asociados' 
      });
    }
    
    // Eliminar mapeos
    await pool.query(`
      DELETE FROM financiador_zona_mapeo 
      WHERE zona_id = ?
    `, [id]);
    
    // Eliminar zona
    await pool.query(`
      DELETE FROM financiador_zonas 
      WHERE id = ?
    `, [id]);
    
    res.json({ message: 'Zona eliminada correctamente' });
  } catch (error) {
    console.error('Error eliminando zona:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/admin/financiadores/:id/zonas - Asignar zonas a financiador
router.post('/financiadores/:id/zonas', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { zonaIds } = req.body;
    
    if (!Array.isArray(zonaIds)) {
      return res.status(400).json({ error: 'zonaIds debe ser un array' });
    }
    
    // Insertar nuevos mapeos
    for (const zonaId of zonaIds) {
      await pool.query(`
        INSERT IGNORE INTO financiador_zona_mapeo (financiador_id, zona_id, activo)
        VALUES (?, ?, 1)
      `, [id, zonaId]);
    }
    
    res.json({ message: 'Zonas asignadas correctamente' });
  } catch (error) {
    console.error('Error asignando zonas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
