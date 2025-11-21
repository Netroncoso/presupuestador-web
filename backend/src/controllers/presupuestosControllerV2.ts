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

// Finalizar presupuesto (evaluar estado final, no crear versión)
export const finalizarPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const { totales } = req.body; // Recibir totales del frontend
  
  const [presupuesto] = await pool.query<any[]>(
    'SELECT * FROM presupuestos WHERE idPresupuestos = ? AND es_ultima_version = 1',
    [id]
  );

  if (presupuesto.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const current = presupuesto[0];
  
  // Actualizar totales si se proporcionaron
  if (totales) {
    await pool.query(`
      UPDATE presupuestos SET 
        total_insumos = ?, 
        total_prestaciones = ?, 
        costo_total = ?, 
        total_facturar = ?, 
        rentabilidad = ?, 
        rentabilidad_con_plazo = ?
      WHERE idPresupuestos = ?
    `, [
      totales.totalInsumos || 0,
      totales.totalPrestaciones || 0, 
      totales.costoTotal || 0,
      totales.totalFacturar || 0,
      totales.rentabilidad || 0,
      totales.rentabilidadConPlazo || 0,
      id
    ]);
  }
  
  // Evaluar estado final usando totales actualizados
  const rentabilidadFinal = totales?.rentabilidad || current.rentabilidad || 0;
  const costoTotalFinal = totales?.costoTotal || current.costo_total || 0;
  
  const estadoFinal = evaluarEstadoAutomatico({ 
    rentabilidad: rentabilidadFinal, 
    costo_total: costoTotalFinal, 
    dificil_acceso: current.dificil_acceso 
  });

  // Actualizar estado si cambió
  if (estadoFinal !== current.estado) {
    await pool.query(
      'UPDATE presupuestos SET estado = ? WHERE idPresupuestos = ?',
      [estadoFinal, id]
    );
    
    // Notificar auditores si quedó pendiente
    if (estadoFinal === 'pendiente') {
      await notificarAuditores(id, current.version, `Presupuesto finalizado requiere aprobación: ${current.Nombre_Apellido}`);
    }
  }

  res.json({ 
    success: true,
    estado: estadoFinal,
    mensaje: estadoFinal === 'pendiente' ? 'Presupuesto enviado para auditoría' : 'Presupuesto finalizado'
  });
});

// Crear nueva versión para edición
export const crearVersionParaEdicion = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const idOriginal = parseInt(req.params.id);
  const usuario_id = req.user?.id;
  
  // Obtener presupuesto original (cualquier versión)
  const [presupuestoOriginal] = await pool.query<any[]>(
    'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
    [idOriginal]
  );

  if (presupuestoOriginal.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const original = presupuestoOriginal[0];
  
  // Obtener insumos y prestaciones para copiar
  const [[insumos], [prestaciones]] = await Promise.all([
    pool.query<any[]>('SELECT producto, costo, precio_facturar, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?', [idOriginal]),
    pool.query<any[]>('SELECT id_servicio, prestacion, valor_asignado, valor_facturar, cantidad FROM presupuesto_prestaciones WHERE idPresupuestos = ?', [idOriginal])
  ]);

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Marcar todas las versiones del mismo grupo como no-actual
    const presupuestoPadreId = original.presupuesto_padre || idOriginal;
    await connection.query(
      'UPDATE presupuestos SET es_ultima_version = 0 WHERE idPresupuestos = ? OR presupuesto_padre = ?',
      [presupuestoPadreId, presupuestoPadreId]
    );

    // Obtener la versión más alta del grupo
    const [maxVersion] = await connection.query<any[]>(
      'SELECT MAX(version) as max_version FROM presupuestos WHERE idPresupuestos = ? OR presupuesto_padre = ?',
      [presupuestoPadreId, presupuestoPadreId]
    );
    const nuevaVersion = (maxVersion[0]?.max_version || 0) + 1;

    // Crear nueva versión para edición
    const [resultPresupuesto] = await connection.query<any>(`
      INSERT INTO presupuestos 
      (version, presupuesto_padre, es_ultima_version, estado, usuario_id,
       Nombre_Apellido, DNI, Sucursal, dificil_acceso, idobra_social,
       total_insumos, total_prestaciones, costo_total, total_facturar, 
       rentabilidad, rentabilidad_con_plazo)
      VALUES (?, ?, 1, 'borrador', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      nuevaVersion,
      presupuestoPadreId,
      usuario_id,
      original.Nombre_Apellido,
      original.DNI,
      original.Sucursal,
      original.dificil_acceso,
      original.idobra_social,
      original.total_insumos,
      original.total_prestaciones,
      original.costo_total,
      original.total_facturar,
      original.rentabilidad,
      original.rentabilidad_con_plazo
    ]);

    const nuevoId = resultPresupuesto.insertId;

    // Copiar insumos y prestaciones
    console.log(`Copiando ${insumos.length} insumos y ${prestaciones.length} prestaciones para presupuesto ${nuevoId}`);
    
    if (insumos.length > 0) {
      const insumosValues = insumos.map(i => [nuevoId, i.producto, i.costo, i.precio_facturar, i.cantidad]);
      await connection.query('INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, precio_facturar, cantidad) VALUES ?', [insumosValues]);
      console.log(`✓ Copiados ${insumos.length} insumos`);
    }

    if (prestaciones.length > 0) {
      const prestacionesValues = prestaciones.map(p => [nuevoId, p.id_servicio, p.prestacion, p.cantidad, p.valor_asignado, p.valor_facturar]);
      await connection.query('INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) VALUES ?', [prestacionesValues]);
      console.log(`✓ Copiadas ${prestaciones.length} prestaciones`);
    }
    
    console.log(`✓ Nueva versión creada: ID ${nuevoId}, versión ${nuevaVersion}, financiador: ${original.idobra_social}`);

    await connection.commit();
    res.status(201).json({ 
      id: nuevoId, 
      version: nuevaVersion,
      estado: 'borrador'
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
      p.total_facturar, p.rentabilidad, p.rentabilidad_con_plazo, p.created_at,
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
      p.total_facturar, p.rentabilidad_con_plazo,
      p.created_at, u.username as creador,
      s.Sucursales_mh as sucursal_nombre,
      f.Financiador as financiador_nombre,
      DATEDIFF(NOW(), p.created_at) as dias_pendiente
    FROM presupuestos p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID
    LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
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
  
  // Obtener presupuesto con información del financiador (cualquier versión)
  const [rows] = await pool.query<any[]>(`
    SELECT p.*, f.Financiador, f.tasa_mensual, f.dias_cobranza_teorico, f.dias_cobranza_real,
           fa.nombre as acuerdo_nombre
    FROM presupuestos p 
    LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
    LEFT JOIN financiador_acuerdo fa ON f.id_acuerdo = fa.id_acuerdo
    WHERE p.idPresupuestos = ?
  `, [id]);

  if (rows.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const presupuesto = rows[0];

  // Obtener prestaciones del presupuesto
  const [prestaciones] = await pool.query<any[]>(`
    SELECT pp.*, s.nombre as servicio_nombre, s.tipo_unidad
    FROM presupuesto_prestaciones pp
    LEFT JOIN servicios s ON CAST(pp.id_servicio AS UNSIGNED) = s.id_servicio
    WHERE pp.idPresupuestos = ?
    ORDER BY pp.prestacion
  `, [id]);

  // Obtener insumos del presupuesto
  const [insumos] = await pool.query<any[]>(`
    SELECT * FROM presupuesto_insumos 
    WHERE idPresupuestos = ?
    ORDER BY producto
  `, [id]);

  res.json({
    ...presupuesto,
    prestaciones,
    insumos
  });
});

export const actualizarPrestador = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { idobra_social } = req.body;
  
  const [result] = await pool.query<any>(`
    UPDATE presupuestos 
    SET idobra_social = ? 
    WHERE idPresupuestos = ?
  `, [idobra_social, id]);

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  res.json({ ok: true });
});

// Alias para compatibilidad
export const guardarVersion = finalizarPresupuesto;