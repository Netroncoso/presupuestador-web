import { Request, Response } from 'express';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { PresupuestoService } from '../services/presupuestoService';
import { PresupuestoRepository } from '../repositories/presupuestoRepository';
import { VersioningService } from '../services/versioningService';
import { AuditoriaService } from '../services/auditoriaService';
import { BusinessRules } from '../config/businessRules';
import { PresupuestoCompleto, PresupuestoPrestacionCompleto, PresupuestoInsumos, MutationResult } from '../types/database';

const presupuestoService = new PresupuestoService();
const versioningService = new VersioningService();
const auditoriaService = new AuditoriaService();

function calcularTotalesPresupuesto(presupuesto: any) {
  const totalInsumos = Number(presupuesto.calc_total_insumos);
  const totalPrestaciones = Number(presupuesto.calc_total_prestaciones);
  const totalEquipamientos = Number(presupuesto.calc_total_equipamientos || 0);
  const costoTotal = totalInsumos + totalPrestaciones + totalEquipamientos;
  const totalFacturar = Number(presupuesto.calc_total_insumos_facturar) + Number(presupuesto.calc_total_prestaciones_facturar) + Number(presupuesto.calc_total_equipamientos_facturar || 0);
  const rentabilidad = costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;

  let rentabilidadConPlazo = rentabilidad;
  if (presupuesto.financiador_id && presupuesto.tasa_mensual && costoTotal > 0) {
    const diasCobranza = presupuesto.dias_cobranza_real || presupuesto.dias_cobranza_teorico || 30;
    const tasaMensual = (presupuesto.tasa_mensual || 2) / 100;
    const mesesCobranza = Math.floor(diasCobranza / 30);
    const valorPresente = totalFacturar / Math.pow(1 + tasaMensual, mesesCobranza);
    const utilidadConPlazo = valorPresente - costoTotal;
    rentabilidadConPlazo = (utilidadConPlazo / costoTotal) * 100;
  }

  return {
    ...presupuesto,
    total_insumos: totalInsumos,
    total_prestaciones: totalPrestaciones,
    total_equipamiento: totalEquipamientos,
    costo_total: costoTotal,
    total_facturar: totalFacturar,
    rentabilidad: rentabilidad,
    rentabilidad_con_plazo: rentabilidadConPlazo
  };
}

async function obtenerPrestacionesPresupuesto(id: number) {
  const [prestaciones] = await pool.query<any[]>(`
    SELECT pp.*, fs.codigo_financiador
    FROM presupuesto_prestaciones pp
    LEFT JOIN financiador_servicio fs ON pp.id_financiador_servicio = fs.id
    WHERE pp.idPresupuestos = ?
    ORDER BY pp.prestacion
  `, [id]);
  return prestaciones;
}

async function obtenerInsumosPresupuesto(id: number) {
  const [insumos] = await pool.query<any[]>(`
    SELECT * FROM presupuesto_insumos 
    WHERE idPresupuestos = ?
    ORDER BY producto
  `, [id]);
  return insumos;
}

async function obtenerEquipamientosPresupuesto(id: number) {
  const [equipamientos] = await pool.query<any[]>(`
    SELECT pe.*, e.nombre, te.nombre as tipo
    FROM presupuesto_equipamiento pe
    LEFT JOIN equipamientos e ON pe.id_equipamiento = e.id
    LEFT JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
    WHERE pe.idPresupuestos = ?
    ORDER BY e.nombre
  `, [id]);
  return equipamientos;
}

// Listar solo últimas versiones
// Listar solo últimas versiones
export const listarPresupuestos = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const limit = parseInt(req.query.limit as string) || BusinessRules.paginacion.limitDefault;
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * limit;
  const estado = req.query.estado as string;
  const scope = req.query.scope as string;
  const search = req.query.search as string;
  const paciente = req.query.paciente as string;
  const userId = req.user?.id;
  const userRole = req.user?.rol;

  let baseWhere = 'WHERE p.es_ultima_version = 1';
  const params: any[] = [];
  let needsUserJoin = false;

  if (userRole === 'user') {
    if (scope === 'solo-mios') {
      baseWhere += ' AND p.usuario_id = ?';
      params.push(userId);
    } else {
      // Necesitamos JOIN con usuarios solo para este caso (filtrar por sucursal del creador)
      needsUserJoin = true;
      baseWhere += ' AND (p.usuario_id = ? OR u.sucursal_id = (SELECT sucursal_id FROM usuarios WHERE id = ?))';
      params.push(userId, userId);
    }
  }

  if (estado) {
    baseWhere += ' AND p.estado = ?';
    params.push(estado);
  }

  if (search) {
    baseWhere += ' AND (p.Nombre_Apellido LIKE ? OR p.DNI LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (paciente) {
    baseWhere += ' AND p.Nombre_Apellido LIKE ?';
    params.push(`%${paciente}%`);
  }

  // Query principal (siempre hace join con usuarios para mostrar nombre del creador)
  const [rows] = await pool.query<any[]>(`
    SELECT 
      p.idPresupuestos, p.version, p.estado, p.resultado_auditoria,
      p.Nombre_Apellido, p.DNI, p.sucursal_id, s.Sucursales_mh as Sucursal, p.financiador_id, p.zona_tarifario_id, p.zona_financiador_id,
      p.total_insumos, p.total_prestaciones, p.costo_total, 
      p.total_facturar, (p.total_facturar - p.costo_total) AS utilidad, p.rentabilidad, p.rentabilidad_con_plazo, 
      p.created_at, u.username as usuario_creador
    FROM presupuestos p 
    LEFT JOIN usuarios u ON p.usuario_id = u.id 
    LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
    ${baseWhere}
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);

  // Query conteo total (Optimizado: Solo hace JOIN si es necesario por el filtro)
  let countQuery = `SELECT COUNT(*) as total FROM presupuestos p`;

  if (needsUserJoin) {
    countQuery += ` LEFT JOIN usuarios u ON p.usuario_id = u.id`;
  }

  countQuery += ` ${baseWhere}`;

  const [countResult] = await pool.query<any[]>(countQuery, params);

  const total = countResult[0]?.total || 0;

  res.json({
    data: rows,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Crear presupuesto (versión 1)
export const crearPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { nombre, dni, sucursal_id, zona_tarifario_id, zona_financiador_id, dificil_acceso, porcentaje_insumos, financiador_id } = req.body;
  const usuario_id = req.user?.id;

  if (!nombre || !dni || !sucursal_id) {
    throw new AppError(400, 'Datos incompletos: nombre, dni y sucursal_id son requeridos');
  }

  // Calcular porcentaje total (sucursal + financiador)
  let porcentajeTotal = Number(porcentaje_insumos) || 0;

  if (financiador_id) {
    const [financiador] = await pool.query<any[]>(
      'SELECT porcentaje_insumos FROM financiador WHERE id = ?',
      [financiador_id]
    );

    if (financiador.length > 0) {
      const porcentajeFinanciador = Number(financiador[0].porcentaje_insumos) || 0;
      porcentajeTotal += porcentajeFinanciador;
    }
  }

  try {
    const [result] = await pool.query<MutationResult>(`
      INSERT INTO presupuestos 
      (Nombre_Apellido, DNI, sucursal_id, zona_tarifario_id, zona_financiador_id, financiador_id, dificil_acceso, porcentaje_insumos, usuario_id, version, es_ultima_version, estado) 
      VALUES (?,?,?,?,?,?,?,?,?,?, 1, ?)
    `, [nombre.trim(), dni, sucursal_id, zona_tarifario_id || null, zona_financiador_id || null, financiador_id || null, dificil_acceso || 'no', porcentajeTotal, usuario_id, BusinessRules.versionado.versionInicial, BusinessRules.estados.iniciales[0]]);

    res.status(201).json({ id: result.insertId, version: 1 });
  } catch (error) {
    throw new AppError(500, 'Error al crear presupuesto');
  }
});

// Finalizar presupuesto (evaluar estado final, no crear versión)
export const finalizarPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const resultado = await presupuestoService.finalizar(id);

  res.json(resultado);
});

// Solicitar auditoría manual
export const solicitarAuditoriaManual = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const usuarioId = req.user?.id;

  const resultado = await presupuestoService.solicitarAuditoriaManual(id, usuarioId);
  res.json(resultado);
});

// Crear nueva versión para edición
export const crearVersionParaEdicion = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const idOriginal = parseInt(req.params.id);
  const usuario_id = req.user?.id;
  const { confirmar } = req.body;

  const resultado = await versioningService.crearNuevaVersion(idOriginal, usuario_id, confirmar);

  const statusCode = resultado.requiereNuevaVersion && resultado.id !== idOriginal ? 201 : 200;
  res.status(statusCode).json(resultado);
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

  const resultado = await auditoriaService.cambiarEstado(id, estado, auditor_id, comentario);
  res.json(resultado);
});

// Obtener presupuestos pendientes (solo auditor/admin)
export const obtenerPendientes = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query<any[]>(`
    SELECT 
      p.idPresupuestos, p.version, p.estado,
      p.Nombre_Apellido, p.DNI, p.sucursal_id, ps.Sucursales_mh as Sucursal, 
      p.costo_total, p.rentabilidad, p.dificil_acceso,
      p.total_facturar, p.rentabilidad_con_plazo,
      p.created_at, u.username as creador,
      s.Sucursales_mh as sucursal_nombre,
      f.Financiador as financiador_nombre,
      DATEDIFF(NOW(), p.created_at) as dias_pendiente
    FROM presupuestos p
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    LEFT JOIN sucursales_mh s ON u.sucursal_id = s.ID
    LEFT JOIN sucursales_mh ps ON p.sucursal_id = ps.ID
    LEFT JOIN financiador f ON p.financiador_id = f.id
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
    SELECT 
      p.idPresupuestos, 
      p.Nombre_Apellido, 
      p.DNI, 
      p.sucursal_id,
      p.zona_tarifario_id,
      p.zona_financiador_id,
      p.estado,
      s.Sucursales_mh as Sucursal, 
      p.financiador_id, 
      p.created_at 
    FROM presupuestos p
    LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
    WHERE p.DNI = ? AND p.es_ultima_version = 1 
    ORDER BY p.created_at DESC LIMIT 1
  `, [dni]);

  res.json(rows.length > 0 ? { exists: true, presupuesto: rows[0] } : { exists: false });
});

export const obtenerPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);

  // Query principal simplificado - solo datos esenciales
  const [rows] = await pool.query<any[]>(`
    SELECT p.* FROM presupuestos p WHERE p.idPresupuestos = ?
  `, [id]);

  if (rows.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const presupuesto = rows[0];

  // Cargar datos relacionados en paralelo
  const [prestaciones, insumos, equipamientos, sucursal, zonaT, zonaF, financiador, usuario] = await Promise.all([
    obtenerPrestacionesPresupuesto(id),
    obtenerInsumosPresupuesto(id),
    obtenerEquipamientosPresupuesto(id),
    presupuesto.sucursal_id ? pool.query('SELECT Sucursales_mh FROM sucursales_mh WHERE ID = ?', [presupuesto.sucursal_id]) : Promise.resolve([[]]),
    presupuesto.zona_tarifario_id ? pool.query('SELECT nombre FROM tarifario_zonas WHERE id = ?', [presupuesto.zona_tarifario_id]) : Promise.resolve([[]]),
    presupuesto.zona_financiador_id ? pool.query('SELECT nombre FROM financiador_zonas WHERE id = ?', [presupuesto.zona_financiador_id]) : Promise.resolve([[]]),
    presupuesto.financiador_id ? pool.query('SELECT Financiador, tasa_mensual, dias_cobranza_teorico, dias_cobranza_real FROM financiador WHERE id = ?', [presupuesto.financiador_id]) : Promise.resolve([[]]),
    presupuesto.usuario_id ? pool.query('SELECT username FROM usuarios WHERE id = ?', [presupuesto.usuario_id]) : Promise.resolve([[]])
  ]);

  res.json({
    ...presupuesto,
    Sucursal: sucursal[0][0]?.Sucursales_mh || null,
    zona_tarifario_nombre: zonaT[0][0]?.nombre || null,
    zona_financiador_nombre: zonaF[0][0]?.nombre || null,
    Financiador: financiador[0][0]?.Financiador || null,
    tasa_mensual: financiador[0][0]?.tasa_mensual || null,
    dias_cobranza_teorico: financiador[0][0]?.dias_cobranza_teorico || null,
    dias_cobranza_real: financiador[0][0]?.dias_cobranza_real || null,
    usuario_creador: usuario[0][0]?.username || null,
    prestaciones,
    insumos,
    equipamientos
  });
});

export const actualizarFinanciador = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { financiador_id } = req.body;

  const resultado = await auditoriaService.actualizarFinanciador(id, financiador_id);
  res.json(resultado);
});

export const actualizarDatosPaciente = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { 
    fecha_nacimiento, 
    numero_afiliado, 
    contacto_nombre, 
    contacto_telefono, 
    diagnostico_medico, 
    domicilio, 
    localidad 
  } = req.body;

  await pool.query(`
    UPDATE presupuestos 
    SET fecha_nacimiento = ?, 
        numero_afiliado = ?, 
        contacto_nombre = ?, 
        contacto_telefono = ?, 
        diagnostico_medico = ?, 
        domicilio = ?, 
        localidad = ?
    WHERE idPresupuestos = ?
  `, [
    fecha_nacimiento || null,
    numero_afiliado || null,
    contacto_nombre || null,
    contacto_telefono || null,
    diagnostico_medico || null,
    domicilio || null,
    localidad || null,
    id
  ]);

  res.json({ success: true, message: 'Datos del paciente actualizados' });
});

export const revertirABorrador = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const repo = new PresupuestoRepository();
  await repo.revertirABorrador(id);

  // Recalcular totales después de revertir
  const { presupuestoCalculosService } = await import('../services/presupuestoCalculosService');
  await presupuestoCalculosService.recalcularTotales(id);

  res.json({ success: true });
});

export const recalcularTotalesPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { presupuestoCalculosService } = await import('../services/presupuestoCalculosService');
  await presupuestoCalculosService.recalcularTotales(id);
  res.json({ success: true });
});
