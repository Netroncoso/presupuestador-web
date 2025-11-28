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
  
  if (presupuesto.rentabilidad_con_plazo > 25) {
    reglas.push('Rentabilidad con plazo superior a 25%');
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
export const listarPresupuestos = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  const estado = req.query.estado as string;
  const userId = req.user?.id;
  const userRole = req.user?.rol;
  
  let whereClause = 'WHERE p.es_ultima_version = 1';
  const params: any[] = [];
  
  if (userRole === 'user') {
    whereClause += ' AND p.usuario_id = ?';
    params.push(userId);
  }
  
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
  const { nombre, dni, sucursal, dificil_acceso, porcentaje_insumos } = req.body;
  const usuario_id = req.user?.id;
  
  const [result] = await pool.query<any>(`
    INSERT INTO presupuestos 
    (Nombre_Apellido, DNI, Sucursal, dificil_acceso, porcentaje_insumos, usuario_id, version, es_ultima_version, estado) 
    VALUES (?,?,?,?,?,?, 1, 1, 'borrador')
  `, [nombre.trim(), dni, sucursal, dificil_acceso || 'no', porcentaje_insumos || 0, usuario_id]);
  
  res.status(201).json({ id: result.insertId, version: 1 });
});

// Finalizar presupuesto (evaluar estado final, no crear versión)
export const finalizarPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  
  // 1. Obtener presupuesto con totales calculados en una sola query
  const [result] = await pool.query<any[]>(`
    SELECT 
      p.*,
      COALESCE(SUM(i.costo * i.cantidad), 0) as total_insumos_costo,
      COALESCE(SUM(i.precio_facturar * i.cantidad), 0) as total_insumos_facturar,
      COALESCE(SUM(pr.valor_asignado * pr.cantidad), 0) as total_prestaciones_costo,
      COALESCE(SUM(pr.valor_facturar * pr.cantidad), 0) as total_prestaciones_facturar,
      f.tasa_mensual,
      f.dias_cobranza_real,
      f.dias_cobranza_teorico
    FROM presupuestos p
    LEFT JOIN presupuesto_insumos i ON p.idPresupuestos = i.idPresupuestos
    LEFT JOIN presupuesto_prestaciones pr ON p.idPresupuestos = pr.idPresupuestos
    LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
    WHERE p.idPresupuestos = ? AND p.es_ultima_version = 1
    GROUP BY p.idPresupuestos
  `, [id]);

  if (result.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const current = result[0];
  
  if (current.estado !== 'borrador') {
    throw new AppError(400, 'Solo se pueden finalizar presupuestos en borrador');
  }
  
  const totalInsumos = Number(current.total_insumos_costo);
  const totalPrestaciones = Number(current.total_prestaciones_costo);
  const costoTotal = totalInsumos + totalPrestaciones;
  
  if (costoTotal === 0) {
    throw new AppError(400, 'No se puede finalizar un presupuesto sin insumos ni prestaciones');
  }
  
  const totalFacturar = Number(current.total_insumos_facturar) + Number(current.total_prestaciones_facturar);
  const rentabilidad = ((totalFacturar - costoTotal) / costoTotal) * 100;
  
  let rentabilidadConPlazo = rentabilidad;
  
  if (current.idobra_social && current.tasa_mensual) {
    const diasCobranza = current.dias_cobranza_real || current.dias_cobranza_teorico || 30;
    const tasaMensual = (current.tasa_mensual || 2) / 100;
    const mesesCobranza = Math.floor(diasCobranza / 30);
    const valorPresente = totalFacturar / Math.pow(1 + tasaMensual, mesesCobranza);
    const utilidadConPlazo = valorPresente - costoTotal;
    rentabilidadConPlazo = (utilidadConPlazo / costoTotal) * 100;
  }
  
  const estadoFinal = evaluarEstadoAutomatico({ 
    rentabilidad, 
    rentabilidad_con_plazo: rentabilidadConPlazo,
    costo_total: costoTotal, 
    dificil_acceso: current.dificil_acceso 
  });
  
  // Actualizar estado
  await pool.query(
    'UPDATE presupuestos SET estado = ?, total_insumos = ?, total_prestaciones = ?, costo_total = ?, total_facturar = ?, rentabilidad = ?, rentabilidad_con_plazo = ? WHERE idPresupuestos = ?',
    [estadoFinal, totalInsumos, totalPrestaciones, costoTotal, totalFacturar, rentabilidad, rentabilidadConPlazo, id]
  );
  
  // Notificar auditores si es necesario (sin await para no bloquear)
  if (estadoFinal === 'pendiente') {
    notificarAuditores(id, current.version, `Presupuesto finalizado requiere aprobación: ${current.Nombre_Apellido}`).catch(err => console.error('Error notificando:', err));
  }
  
  res.json({ 
    success: true,
    estado: estadoFinal,
    totales: {
      totalInsumos,
      totalPrestaciones,
      costoTotal,
      totalFacturar,
      rentabilidad: Number(rentabilidad.toFixed(2)),
      rentabilidadConPlazo: Number(rentabilidadConPlazo.toFixed(2))
    },
    mensaje: estadoFinal === 'pendiente' ? 'Presupuesto enviado para auditoría' : 'Presupuesto finalizado'
  });
});

// Crear nueva versión para edición
export const crearVersionParaEdicion = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const idOriginal = parseInt(req.params.id);
  const usuario_id = req.user?.id;
  const { confirmar } = req.body;
  
  const [presupuestoOriginal] = await pool.query<any[]>(
    'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
    [idOriginal]
  );

  if (presupuestoOriginal.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const original = presupuestoOriginal[0];
  
  // Si es borrador y no se confirmó, solo retornar info sin crear versión
  if (original.estado === 'borrador' && !confirmar) {
    return res.json({
      requiereNuevaVersion: false,
      id: idOriginal,
      version: original.version,
      estado: 'borrador',
      mensaje: 'Este presupuesto ya está en borrador, puede editarlo directamente'
    });
  }
  
  // Si no es borrador y no se confirmó, pedir confirmación
  if (original.estado !== 'borrador' && !confirmar) {
    return res.json({
      requiereNuevaVersion: true,
      requiereConfirmacion: true,
      estadoActual: original.estado,
      versionActual: original.version,
      mensaje: `El presupuesto está ${original.estado}. Se creará una nueva versión para editar.`
    });
  }
  
  // Crear nueva versión (solo si se confirmó o es necesario)
  const presupuestoPadreId = original.presupuesto_padre || idOriginal;
  
  const [[maxVersion], [insumos], [prestaciones]] = await Promise.all([
    pool.query<any[]>('SELECT MAX(version) as max_version FROM presupuestos WHERE idPresupuestos = ? OR presupuesto_padre = ?', [presupuestoPadreId, presupuestoPadreId]),
    pool.query<any[]>('SELECT producto, costo, precio_facturar, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?', [idOriginal]),
    pool.query<any[]>('SELECT id_servicio, prestacion, valor_asignado, valor_facturar, cantidad FROM presupuesto_prestaciones WHERE idPresupuestos = ?', [idOriginal])
  ]);
  
  const nuevaVersion = (maxVersion[0]?.max_version || 0) + 1;
  
  await pool.query(
    'UPDATE presupuestos SET es_ultima_version = 0 WHERE idPresupuestos = ? OR presupuesto_padre = ?',
    [presupuestoPadreId, presupuestoPadreId]
  );
  
  const [resultPresupuesto] = await pool.query<any>(`
    INSERT INTO presupuestos 
    (version, presupuesto_padre, es_ultima_version, estado, usuario_id,
     Nombre_Apellido, DNI, Sucursal, dificil_acceso, idobra_social,
     total_insumos, total_prestaciones, costo_total, total_facturar, 
     rentabilidad, rentabilidad_con_plazo)
    VALUES (?, ?, 1, 'borrador', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    nuevaVersion, presupuestoPadreId, usuario_id,
    original.Nombre_Apellido, original.DNI, original.Sucursal,
    original.dificil_acceso, original.idobra_social,
    original.total_insumos, original.total_prestaciones,
    original.costo_total, original.total_facturar,
    original.rentabilidad, original.rentabilidad_con_plazo
  ]);

  const nuevoId = resultPresupuesto.insertId;

  const promises = [];
  
  if (insumos.length > 0) {
    const insumosValues = insumos.map(i => [nuevoId, i.producto, i.costo, i.precio_facturar, i.cantidad]);
    promises.push(pool.query('INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, precio_facturar, cantidad) VALUES ?', [insumosValues]));
  }

  if (prestaciones.length > 0) {
    const prestacionesValues = prestaciones.map(p => [nuevoId, p.id_servicio, p.prestacion, p.cantidad, p.valor_asignado, p.valor_facturar]);
    promises.push(pool.query('INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) VALUES ?', [prestacionesValues]));
  }
  
  await Promise.all(promises);

  res.status(201).json({ 
    requiereNuevaVersion: true,
    id: nuevoId, 
    version: nuevaVersion,
    estado: 'borrador',
    mensaje: `Nueva versión ${nuevaVersion} creada para edición`
  });
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
  
  // Obtener presupuesto con totales calculados
  const [rows] = await pool.query<any[]>(`
    SELECT 
      p.*, 
      f.Financiador, f.tasa_mensual, f.dias_cobranza_teorico, f.dias_cobranza_real,
      fa.nombre as acuerdo_nombre,
      u.username as usuario_creador,
      COALESCE(SUM(i.costo * i.cantidad), 0) as calc_total_insumos,
      COALESCE(SUM(i.precio_facturar * i.cantidad), 0) as calc_total_insumos_facturar,
      COALESCE(SUM(pr.valor_asignado * pr.cantidad), 0) as calc_total_prestaciones,
      COALESCE(SUM(pr.valor_facturar * pr.cantidad), 0) as calc_total_prestaciones_facturar
    FROM presupuestos p 
    LEFT JOIN financiador f ON p.idobra_social = f.idobra_social
    LEFT JOIN financiador_acuerdo fa ON f.id_acuerdo = fa.id_acuerdo
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN presupuesto_insumos i ON p.idPresupuestos = i.idPresupuestos
    LEFT JOIN presupuesto_prestaciones pr ON p.idPresupuestos = pr.idPresupuestos
    WHERE p.idPresupuestos = ?
    GROUP BY p.idPresupuestos
  `, [id]);

  if (rows.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  let presupuesto = rows[0];
  
  // Si los totales están en 0, usar los calculados
  if (presupuesto.costo_total === 0 && (presupuesto.calc_total_insumos > 0 || presupuesto.calc_total_prestaciones > 0)) {
    const totalInsumos = Number(presupuesto.calc_total_insumos);
    const totalPrestaciones = Number(presupuesto.calc_total_prestaciones);
    const costoTotal = totalInsumos + totalPrestaciones;
    const totalFacturar = Number(presupuesto.calc_total_insumos_facturar) + Number(presupuesto.calc_total_prestaciones_facturar);
    const rentabilidad = costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;
    
    let rentabilidadConPlazo = rentabilidad;
    if (presupuesto.idobra_social && presupuesto.tasa_mensual && costoTotal > 0) {
      const diasCobranza = presupuesto.dias_cobranza_real || presupuesto.dias_cobranza_teorico || 30;
      const tasaMensual = (presupuesto.tasa_mensual || 2) / 100;
      const mesesCobranza = Math.floor(diasCobranza / 30);
      const valorPresente = totalFacturar / Math.pow(1 + tasaMensual, mesesCobranza);
      const utilidadConPlazo = valorPresente - costoTotal;
      rentabilidadConPlazo = (utilidadConPlazo / costoTotal) * 100;
    }
    
    presupuesto.total_insumos = totalInsumos;
    presupuesto.total_prestaciones = totalPrestaciones;
    presupuesto.costo_total = costoTotal;
    presupuesto.total_facturar = totalFacturar;
    presupuesto.rentabilidad = rentabilidad;
    presupuesto.rentabilidad_con_plazo = rentabilidadConPlazo;
  }

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
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Actualizar financiador
    await connection.query(
      'UPDATE presupuestos SET idobra_social = ? WHERE idPresupuestos = ?',
      [idobra_social, id]
    );
    
    // Obtener presupuesto actualizado
    const [presupuesto] = await connection.query<any[]>(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto.length === 0) {
      throw new AppError(404, 'Presupuesto no encontrado');
    }
    
    const current = presupuesto[0];
    
    // Recalcular rentabilidad con plazo si hay financiador y totales
    if (idobra_social && current.costo_total > 0) {
      const [financiador] = await connection.query<any[]>(
        'SELECT tasa_mensual, dias_cobranza_real, dias_cobranza_teorico FROM financiador WHERE idobra_social = ?',
        [idobra_social]
      );
      
      if (financiador.length > 0) {
        const diasCobranza = financiador[0].dias_cobranza_real || financiador[0].dias_cobranza_teorico || 30;
        const tasaMensual = (financiador[0].tasa_mensual || 2) / 100;
        const mesesCobranza = Math.floor(diasCobranza / 30);
        
        const valorPresente = current.total_facturar / Math.pow(1 + tasaMensual, mesesCobranza);
        const utilidadConPlazo = valorPresente - current.costo_total;
        const rentabilidadConPlazo = (utilidadConPlazo / current.costo_total) * 100;
        
        await connection.query(
          'UPDATE presupuestos SET rentabilidad_con_plazo = ? WHERE idPresupuestos = ?',
          [rentabilidadConPlazo, id]
        );
      }
    }
    
    await connection.commit();
    res.json({ ok: true });
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});