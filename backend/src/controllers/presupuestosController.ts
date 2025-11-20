import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { broadcastPresupuestoUpdate, broadcastNotificationUpdate } from './sseController';

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

export const listarPresupuestos = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = parseInt(req.query.offset as string) || 0;
  
  const [rows] = await pool.query<any[]>(
    `SELECT p.idPresupuestos, p.Nombre_Apellido, p.DNI, p.Sucursal, p.idobra_social, 
     p.total_insumos, p.total_prestaciones, p.costo_total, p.total_facturar, 
     p.rentabilidad, p.rentabilidad_con_plazo, p.created_at, p.version, p.estado,
     u.username as usuario_creador 
     FROM presupuestos p 
     LEFT JOIN usuarios u ON p.usuario_id = u.id 
     WHERE p.es_ultima_version = 1 OR p.es_ultima_version IS NULL
     ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  res.json(rows);
});

export const verificarDNI = asyncHandler(async (req: Request, res: Response) => {
  const { dni } = req.params;
  
  if (!dni || !/^\d{7,8}$/.test(dni)) {
    throw new AppError(400, 'DNI debe tener 7-8 dígitos');
  }

  const [rows] = await pool.query<any[]>(
    'SELECT idPresupuestos, Nombre_Apellido, DNI, Sucursal, idobra_social, created_at FROM presupuestos WHERE DNI = ? ORDER BY created_at DESC LIMIT 1',
    [dni]
  );

  res.json(rows.length > 0 ? { exists: true, presupuesto: rows[0] } : { exists: false });
});

export const obtenerPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    throw new AppError(400, 'ID de presupuesto inválido');
  }

  const [rows] = await pool.query<any[]>(
    `SELECT p.idPresupuestos, p.Nombre_Apellido, p.DNI, p.Sucursal, p.idobra_social, p.dificil_acceso, 
     p.created_at, p.updated_at, s.suc_porcentaje_insumos as porcentaje_insumos
     FROM presupuestos p 
     LEFT JOIN sucursales_mh s ON p.Sucursal = s.Sucursales_mh 
     WHERE p.idPresupuestos = ?`,
    [id]
  );

  if (rows.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  res.json(rows[0]);
});

export const crearPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const validationErrors = validatePresupuestoData(req.body);
  if (validationErrors.length > 0) {
    throw new AppError(400, validationErrors.join(', '));
  }

  const { nombre, dni, sucursal, dificil_acceso } = req.body;
  const usuario_id = req.user?.id;
  
  try {
    const [result] = await pool.query<any>(
      'INSERT INTO presupuestos (Nombre_Apellido, DNI, Sucursal, dificil_acceso, usuario_id, version, es_ultima_version, estado) VALUES (?,?,?,?,?,?,?,?)',
      [nombre.trim(), dni, sucursal, dificil_acceso || 'no', usuario_id, 0, 1, 'borrador']
    );
    res.status(201).json({ id: result.insertId });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'Ya existe un presupuesto con este DNI');
    }
    throw err;
  }
});

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

export const actualizarTotales = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    throw new AppError(400, 'ID de presupuesto inválido');
  }

  const validationErrors = validateTotalesData(req.body);
  if (validationErrors.length > 0) {
    throw new AppError(400, validationErrors.join(', '));
  }

  const { total_insumos, total_prestaciones } = req.body;
  const costo_total = Number(total_insumos) + Number(total_prestaciones);
  
  const [result] = await pool.query<any>(
    'UPDATE presupuestos SET total_insumos = ?, total_prestaciones = ?, costo_total = ? WHERE idPresupuestos = ?',
    [Number(total_insumos), Number(total_prestaciones), costo_total, id]
  );

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  res.json({ ok: true });
});

export const actualizarPrestador = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    throw new AppError(400, 'ID de presupuesto inválido');
  }

  const { idobra_social } = req.body;
  
  if (!idobra_social) {
    throw new AppError(400, 'ID de obra social es requerido');
  }

  const [result] = await pool.query<any>(
    'UPDATE presupuestos SET idobra_social = ? WHERE idPresupuestos = ?',
    [idobra_social, id]
  );

  if (result.affectedRows === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  res.json({ ok: true });
});

export const obtenerHistorial = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    throw new AppError(400, 'ID de presupuesto inválido');
  }

  // Obtener presupuesto padre
  const [presupuestoBase] = await pool.query<any[]>(
    'SELECT presupuesto_padre FROM presupuestos WHERE idPresupuestos = ?',
    [id]
  );

  if (presupuestoBase.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const presupuestoPadre = presupuestoBase[0].presupuesto_padre || id;

  // Obtener todas las versiones
  const [rows] = await pool.query<any[]>(
    `SELECT p.idPresupuestos, p.version, p.estado, p.total_insumos, p.total_prestaciones, 
     p.costo_total, p.total_facturar, p.rentabilidad, p.rentabilidad_con_plazo, 
     p.created_at, p.es_ultima_version, u.username as usuario_creador
     FROM presupuestos p 
     LEFT JOIN usuarios u ON p.usuario_id = u.id 
     WHERE p.idPresupuestos = ? OR p.presupuesto_padre = ?
     ORDER BY p.version ASC`,
    [presupuestoPadre, presupuestoPadre]
  );

  res.json(rows);
});

export const guardarVersion = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const idOriginal = parseInt(req.params.id);
  
  if (isNaN(idOriginal) || idOriginal <= 0) {
    throw new AppError(400, 'ID de presupuesto inválido');
  }

  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Obtener presupuesto original
    const [presupuestoOriginal] = await connection.query<any[]>(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [idOriginal]
    );

    if (presupuestoOriginal.length === 0) {
      throw new AppError(404, 'Presupuesto no encontrado');
    }

    const original = presupuestoOriginal[0];
    const { total_insumos, total_prestaciones, costo_total, total_facturar, rentabilidad, rentabilidad_con_plazo } = req.body;
    const usuario_id = req.user?.id;

    // Determinar presupuesto padre y nueva versión
    const presupuestoPadre = original.presupuesto_padre || idOriginal;
    const nuevaVersion = original.version === 0 ? 1 : (original.version || 1) + 1;

    // Marcar versión anterior como no-actual
    await connection.query(
      'UPDATE presupuestos SET es_ultima_version = 0 WHERE idPresupuestos = ?',
      [idOriginal]
    );

    // Evaluar reglas automáticas para determinar estado
    let estado = 'borrador';
    if (rentabilidad < 15 || costo_total > 150000 || original.dificil_acceso === 'SI') {
      estado = 'pendiente';
    }

    // Crear nueva versión
    const [resultPresupuesto] = await connection.query<any>(
      `INSERT INTO presupuestos 
       (Nombre_Apellido, DNI, Sucursal, dificil_acceso, idobra_social, 
        total_insumos, total_prestaciones, costo_total, total_facturar, 
        rentabilidad, rentabilidad_con_plazo, usuario_id, 
        version, presupuesto_padre, es_ultima_version, estado) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
        rentabilidad || 0,
        rentabilidad_con_plazo || null,
        usuario_id,
        nuevaVersion,
        presupuestoPadre,
        1, // es_ultima_version
        estado
      ]
    );

    const nuevoId = resultPresupuesto.insertId;

    // Copiar insumos y prestaciones
    const [[insumos], [prestaciones]] = await Promise.all([
      connection.query<any[]>('SELECT producto, costo, precio_facturar, cantidad FROM presupuesto_insumos WHERE idPresupuestos = ?', [idOriginal]),
      connection.query<any[]>('SELECT id_servicio, prestacion, cantidad, valor_asignado, valor_facturar FROM presupuesto_prestaciones WHERE idPresupuestos = ?', [idOriginal])
    ]);

    if (insumos.length > 0) {
      const insumosValues = insumos.map(i => [nuevoId, i.producto, i.costo, i.precio_facturar, i.cantidad]);
      await connection.query('INSERT INTO presupuesto_insumos (idPresupuestos, producto, costo, precio_facturar, cantidad) VALUES ?', [insumosValues]);
    }

    if (prestaciones.length > 0) {
      const prestacionesValues = prestaciones.map(p => [nuevoId, p.id_servicio, p.prestacion, p.cantidad, p.valor_asignado, p.valor_facturar]);
      await connection.query('INSERT INTO presupuesto_prestaciones (idPresupuestos, id_servicio, prestacion, cantidad, valor_asignado, valor_facturar) VALUES ?', [prestacionesValues]);
    }

    // Si quedó pendiente, notificar auditores
    if (estado === 'pendiente') {
      await connection.query(`
        INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'pendiente', ?
        FROM usuarios u WHERE u.rol = 'auditor_medico'
      `, [nuevoId, nuevaVersion, `Nuevo presupuesto pendiente: ${original.Nombre_Apellido}`]);
    }

    await connection.commit();
    
    // Broadcast updates via SSE
    if (estado === 'pendiente') {
      broadcastPresupuestoUpdate();
      // Notify all auditors
      const [auditores] = await pool.query<any[]>('SELECT id FROM usuarios WHERE rol = "auditor_medico"');
      auditores.forEach(auditor => broadcastNotificationUpdate(auditor.id));
    }
    
    res.status(201).json({ id: nuevoId, version: nuevaVersion, estado });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
