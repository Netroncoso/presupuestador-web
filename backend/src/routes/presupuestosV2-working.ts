import { Router } from 'express';
import { pool } from '../db';
import { auth } from '../middleware/auth';

const router = Router();

// Middleware para verificar rol auditor/admin
const requireAuditor = (req: any, res: any, next: any) => {
  if (!['auditor_medico', 'admin'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado: Solo auditores o admins' });
  }
  next();
};

// Función para evaluar reglas automáticas
const evaluarEstadoAutomatico = (presupuesto: any) => {
  if (presupuesto.rentabilidad < 15) return 'pendiente';
  if (presupuesto.costo_total > 150000) return 'pendiente';
  if (presupuesto.dificil_acceso === 'SI') return 'pendiente';
  return 'borrador';
};

// Función para notificar auditores
const notificarAuditores = async (presupuestoId: number, version: number, mensaje: string) => {
  try {
    await pool.query(`
      INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
      SELECT u.id, ?, ?, 'pendiente', ?
      FROM usuarios u WHERE u.rol = 'auditor_medico'
    `, [presupuestoId, version, mensaje]);
  } catch (error) {
    console.error('Error notificando auditores:', error);
  }
};

// Obtener presupuestos pendientes (solo auditor/admin)
router.get('/auditor/pendientes', auth, requireAuditor, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.idPresupuestos, p.version, p.estado,
        p.Nombre_Apellido, p.DNI, p.Sucursal, 
        p.costo_total, p.rentabilidad, p.dificil_acceso,
        p.created_at, u.username as creador,
        s.Sucursales_mh as sucursal_nombre,
        DATEDIFF(NOW(), p.created_at) as dias_pendiente
      FROM presupuestos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID
      WHERE p.estado IN ('pendiente', 'en_revision') 
      AND p.es_ultima_version = 1
      ORDER BY p.created_at ASC
    `);
    
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo pendientes' });
  }
});

// Cambiar estado (solo auditor/admin)
router.put('/:id/estado', auth, requireAuditor, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const { estado, comentario } = req.body;
  const auditor_id = req.user?.id;
  
  if (!['pendiente', 'en_revision', 'aprobado', 'rechazado'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Obtener presupuesto actual
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
      [id]
    );
    
    if ((presupuesto as any[]).length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    
    const estadoAnterior = (presupuesto as any)[0].estado;
    
    // Actualizar estado
    await connection.query(
      'UPDATE presupuestos SET estado = ? WHERE idPresupuestos = ?',
      [estado, id]
    );
    
    // Registrar auditoría
    await connection.query(`
      INSERT INTO auditorias_presupuestos 
      (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, (presupuesto as any)[0].version, auditor_id, estadoAnterior, estado, comentario || null]);
    
    // Notificar al usuario creador
    if (['aprobado', 'rechazado'].includes(estado)) {
      await connection.query(`
        INSERT IGNORE INTO notificaciones 
        (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        VALUES (?, ?, ?, ?, ?)
      `, [
        (presupuesto as any)[0].usuario_id, 
        id, 
        (presupuesto as any)[0].version, 
        estado, 
        `Presupuesto v${(presupuesto as any)[0].version} ${estado.toUpperCase()} por auditor`
      ]);
    }
    
    await connection.commit();
    res.json({ success: true, estado });
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Error cambiando estado' });
  } finally {
    connection.release();
  }
});

// Crear nueva versión al editar
router.put('/:id/nueva-version', auth, async (req: any, res) => {
  const idOriginal = parseInt(req.params.id);
  const { total_insumos, total_prestaciones, costo_total, total_facturar, rentabilidad, rentabilidad_con_plazo } = req.body;
  const usuario_id = req.user?.id;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtener presupuesto original
    const [presupuestoOriginal] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
      [idOriginal]
    );

    if ((presupuestoOriginal as any[]).length === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    const original = (presupuestoOriginal as any)[0];
    
    // Evaluar estado automático
    const nuevoEstado = evaluarEstadoAutomatico({ 
      rentabilidad, 
      costo_total, 
      dificil_acceso: original.dificil_acceso 
    });

    // Marcar versión anterior como no-actual
    await connection.query(
      'UPDATE presupuestos SET es_ultima_version = 0 WHERE idPresupuestos = ?',
      [idOriginal]
    );

    // Crear nueva versión
    const [resultPresupuesto] = await connection.query(`
      INSERT INTO presupuestos 
      (version, presupuesto_padre, es_ultima_version, estado, usuario_id,
       Nombre_Apellido, DNI, Sucursal, dificil_acceso, idobra_social,
       total_insumos, total_prestaciones, costo_total, total_facturar, 
       rentabilidad, rentabilidad_con_plazo)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      original.version + 1,
      original.presupuesto_padre || idOriginal,
      nuevoEstado,
      usuario_id,
      original.Nombre_Apellido,
      original.DNI,
      original.Sucursal,
      original.dificil_acceso,
      original.idobra_social,
      total_insumos || 0,
      total_prestaciones || 0,
      costo_total || 0,
      total_facturar || 0,
      rentabilidad || 0,
      rentabilidad_con_plazo || null
    ]);

    const nuevoId = (resultPresupuesto as any).insertId;
    const nuevaVersion = original.version + 1;

    // Copiar insumos y prestaciones
    const [[insumos], [prestaciones]] = await Promise.all([
      connection.query('SELECT producto, costo, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?', [idOriginal]),
      connection.query('SELECT id_servicio, prestacion, cantidad, valor_asignado FROM presupuesto_prestaciones WHERE idPresupuestos = ?', [idOriginal])
    ]);

    if ((insumos as any[]).length > 0) {
      const insumosValues = (insumos as any[]).map(i => [nuevoId, i.producto, i.costo, i.cantidad]);
      await connection.query('INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, cantidad) VALUES ?', [insumosValues]);
    }

    if ((prestaciones as any[]).length > 0) {
      const prestacionesValues = (prestaciones as any[]).map(p => [nuevoId, p.id_servicio, p.prestacion, p.cantidad, p.valor_asignado]);
      await connection.query('INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado) VALUES ?', [prestacionesValues]);
    }

    // Notificar si requiere aprobación
    if (nuevoEstado === 'pendiente') {
      await notificarAuditores(nuevoId, nuevaVersion, `Presupuesto v${nuevaVersion} para ${original.Nombre_Apellido} requiere aprobación`);
    }

    await connection.commit();
    res.status(201).json({ 
      id: nuevoId, 
      version: nuevaVersion, 
      estado: nuevoEstado 
    });
    
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: 'Error creando nueva versión' });
  } finally {
    connection.release();
  }
});

// Pedir auditoría manual
router.put('/:id/pedir-auditoria', auth, async (req: any, res) => {
  const id = parseInt(req.params.id);
  
  try {
    // Cambiar estado a pendiente
    const [result] = await pool.query(
      'UPDATE presupuestos SET estado = "pendiente" WHERE idPresupuestos = ? AND es_ultima_version = 1',
      [id]
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }
    
    // Obtener datos del presupuesto
    const [presupuesto] = await pool.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if ((presupuesto as any[]).length > 0) {
      const p = (presupuesto as any)[0];
      await notificarAuditores(id, p.version, `Auditoría solicitada para presupuesto de ${p.Nombre_Apellido}`);
    }
    
    res.json({ success: true, estado: 'pendiente' });
  } catch (error) {
    res.status(500).json({ error: 'Error solicitando auditoría' });
  }
});

export default router;