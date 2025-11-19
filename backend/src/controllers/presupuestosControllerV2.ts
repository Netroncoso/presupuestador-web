import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

// Función para evaluar reglas automáticas
const evaluarEstadoAutomatico = (presupuesto: any) => {
  const reglas = [];
  
  if (presupuesto.rentabilidad < 15) {
    reglas.push('Rentabilidad menor a 15%');
  }
  
  if (presupuesto.costo_total > 150000) {
    reglas.push('Costo total superior a $150,000');
  }
  
  if (presupuesto.dificil_acceso === 'SI') {
    reglas.push('Marcado como difícil acceso');
  }
  
  return reglas.length > 0 ? 'pendiente' : 'borrador';
};

// Función para notificar auditores
const notificarAuditores = async (presupuestoId: number, version: number, mensaje: string) => {
  await pool.query(`
    INSERT IGNORE INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
    SELECT u.id, ?, ?, 'pendiente', ?
    FROM usuarios u WHERE u.rol = 'auditor_medico'
  `, [presupuestoId, version, mensaje]);
};

// Listar solo últimas versiones
export const listarPresupuestos = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  const estado = req.query.estado as string;
  
  let whereClause = 'WHERE p.es_ultima_version = 1';
  const params: any[] = [];
  
  if (estado) {
    whereClause += ' AND p.estado = ?';
    params.push(estado);
  }
  
  params.push(limit, offset);
  
  const [rows] = await pool.query<any[]>(`
    SELECT 
      p.idPresupuestos, p.version, p.estado,
      p.Nombre_Apellido, p.DNI, p.Sucursal, p.idobra_social, 
      p.total_insumos, p.total_prestaciones, p.costo_total, 
      p.total_facturar, p.rentabilidad, p.rentabilidad_con_plazo, 
      p.created_at, u.username as usuario_creador
    FROM presupuestos p 
    LEFT JOIN usuarios u ON p.usuario_id = u.id 
    ${whereClause}
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `, params);
  
  res.json(rows);
});

// Crear presupuesto (versión 1)
export const crearPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { nombre, dni, sucursal, dificil_acceso } = req.body;
  const usuario_id = req.user?.id;
  
  const [result] = await pool.query<any>(`
    INSERT INTO presupuestos 
    (Nombre_Apellido, DNI, Sucursal, dificil_acceso, usuario_id, version, es_ultima_version, estado) 
    VALUES (?,?,?,?,?, 1, 1, 'borrador')
  `, [nombre.trim(), dni, sucursal, dificil_acceso || 'no', usuario_id]);
  
  res.status(201).json({ id: result.insertId, version: 1 });
});

// Crear nueva versión al editar
export const crearNuevaVersion = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const idOriginal = parseInt(req.params.id);
  const { total_insumos, total_prestaciones, costo_total, total_facturar, rentabilidad, rentabilidad_con_plazo } = req.body;
  const usuario_id = req.user?.id;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtener presupuesto original
    const [presupuestoOriginal] = await connection.query<any[]>(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
      [idOriginal]
    );

    if (presupuestoOriginal.length === 0) {
      throw new AppError(404, 'Presupuesto no encontrado');
    }

    const original = presupuestoOriginal[0];
    
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
    const [resultPresupuesto] = await connection.query<any>(`
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

    const nuevoId = resultPresupuesto.insertId;
    const nuevaVersion = original.version + 1;

    // Copiar insumos y prestaciones
    const [[insumos], [prestaciones]] = await Promise.all([
      connection.query<any[]>('SELECT producto, costo, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?', [idOriginal]),
      connection.query<any[]>('SELECT id_servicio, prestacion, cantidad, valor_asignado FROM presupuesto_prestaciones WHERE idPresupuestos = ?', [idOriginal])
    ]);

    if (insumos.length > 0) {
      const insumosValues = insumos.map(i => [nuevoId, i.producto, i.costo, i.cantidad]);
      await connection.query('INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, cantidad) VALUES ?', [insumosValues]);
    }

    if (prestaciones.length > 0) {
      const prestacionesValues = prestaciones.map(p => [nuevoId, p.id_servicio, p.prestacion, p.cantidad, p.valor_asignado]);
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
    throw error;
  } finally {
    connection.release();
  }
});

// Obtener historial de versiones
export const obtenerHistorial = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  const [rows] = await pool.query<any[]>(`
    SELECT 
      p.idPresupuestos, p.version, p.estado, p.es_ultima_version,
      p.total_insumos, p.total_prestaciones, p.costo_total, 
      p.total_facturar, p.rentabilidad, p.created_at,
      u.username as usuario_creador
    FROM presupuestos p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.idPresupuestos = ? OR p.presupuesto_padre = ?
    ORDER BY p.version DESC
  `, [id, id]);
  
  res.json(rows);
});

// Cambiar estado (solo auditor/admin)
export const cambiarEstado = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const { estado, comentario } = req.body;
  const auditor_id = req.user?.id;
  
  if (!['pendiente', 'en_revision', 'aprobado', 'rechazado'].includes(estado)) {
    throw new AppError(400, 'Estado inválido');
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Obtener presupuesto actual
    const [presupuesto] = await connection.query<any[]>(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
      [id]
    );
    
    if (presupuesto.length === 0) {
      throw new AppError(404, 'Presupuesto no encontrado');
    }
    
    const estadoAnterior = presupuesto[0].estado;
    
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
    `, [id, presupuesto[0].version, auditor_id, estadoAnterior, estado, comentario || null]);
    
    // Notificar al usuario creador
    if (['aprobado', 'rechazado'].includes(estado)) {
      await connection.query(`
        INSERT IGNORE INTO notificaciones 
        (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        VALUES (?, ?, ?, ?, ?)
      `, [
        presupuesto[0].usuario_id, 
        id, 
        presupuesto[0].version, 
        estado, 
        `Presupuesto v${presupuesto[0].version} ${estado.toUpperCase()} por auditor`
      ]);
    }
    
    await connection.commit();
    res.json({ success: true, estado });
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

// Obtener presupuestos pendientes (solo auditor/admin)
export const obtenerPendientes = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>(`
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
});

// Mantener funciones existentes para compatibilidad
export const verificarDNI = asyncHandler(async (req: Request, res: Response) => {
  const { dni } = req.params;
  
  const [rows] = await pool.query<any[]>(`
    SELECT idPresupuestos, Nombre_Apellido, DNI, Sucursal, idobra_social, created_at 
    FROM presupuestos 
    WHERE DNI = ? AND es_ultima_version = 1 
    ORDER BY created_at DESC LIMIT 1
  `, [dni]);

  res.json(rows.length > 0 ? { exists: true, presupuesto: rows[0] } : { exists: false });
});

export const obtenerPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  const [rows] = await pool.query<any[]>(`
    SELECT * FROM presupuestos 
    WHERE idPresupuestos = ? AND es_ultima_version = 1
  `, [id]);

  if (rows.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  res.json(rows[0]);
});

export const actualizarTotales = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { total_insumos, total_prestaciones } = req.body;
  const costo_total = Number(total_insumos) + Number(total_prestaciones);
  
  const [result] = await pool.query<any>(`
    UPDATE presupuestos 
    SET total_insumos = ?, total_prestaciones = ?, costo_total = ? 
    WHERE idPresupuestos = ? AND es_ultima_version = 1
  `, [Number(total_insumos), Number(total_prestaciones), costo_total, id]);

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  res.json({ ok: true });
});

export const actualizarPrestador = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { idobra_social } = req.body;
  
  const [result] = await pool.query<any>(`
    UPDATE presupuestos 
    SET idobra_social = ? 
    WHERE idPresupuestos = ? AND es_ultima_version = 1
  `, [idobra_social, id]);

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  res.json({ ok: true });
});