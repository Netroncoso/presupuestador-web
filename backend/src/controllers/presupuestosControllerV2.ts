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
    SELECT pp.*, s.nombre as servicio_nombre, s.tipo_unidad
    FROM presupuesto_prestaciones pp
    LEFT JOIN servicios s ON CAST(pp.id_servicio AS UNSIGNED) = s.id_servicio
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
export const listarPresupuestos = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const limit = parseInt(req.query.limit as string) || BusinessRules.paginacion.limitDefault;
  const offset = parseInt(req.query.offset as string) || BusinessRules.paginacion.offsetDefault;
  const estado = req.query.estado as string;
  const scope = req.query.scope as string;
  const userId = req.user?.id;
  const userRole = req.user?.rol;
  
  let whereClause = 'WHERE p.es_ultima_version = 1';
  const params: any[] = [];
  
  if (userRole === 'user') {
    if (scope === 'solo-mios') {
      whereClause += ' AND p.usuario_id = ?';
      params.push(userId);
    } else {
      whereClause += ' AND (p.usuario_id = ? OR u.sucursal_id = (SELECT sucursal_id FROM usuarios WHERE id = ?))';
      params.push(userId, userId);
    }
  }
  
  if (estado) {
    whereClause += ' AND p.estado = ?';
    params.push(estado);
  }
  
  params.push(limit, offset);
  
  const [rows] = await pool.query<any[]>(`
    SELECT 
      p.idPresupuestos, p.version, p.estado, p.resultado_auditoria,
      p.Nombre_Apellido, p.DNI, p.sucursal_id, s.Sucursales_mh as Sucursal, p.financiador_id, p.zona_id,
      p.total_insumos, p.total_prestaciones, p.costo_total, 
      p.total_facturar, (p.total_facturar - p.costo_total) AS utilidad, p.rentabilidad, p.rentabilidad_con_plazo, 
      p.created_at, u.username as usuario_creador
    FROM presupuestos p 
    LEFT JOIN usuarios u ON p.usuario_id = u.id 
    LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
    ${whereClause}
    ORDER BY p.created_at DESC 
    LIMIT ? OFFSET ?
  `, params);
  
  res.json(rows);
});

// Crear presupuesto (versión 1)
export const crearPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const { nombre, dni, sucursal_id, zona_id, dificil_acceso, porcentaje_insumos, financiador_id } = req.body;
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
      (Nombre_Apellido, DNI, sucursal_id, zona_id, financiador_id, dificil_acceso, porcentaje_insumos, usuario_id, version, es_ultima_version, estado) 
      VALUES (?,?,?,?,?,?,?,?,?, 1, ?)
    `, [nombre.trim(), dni, sucursal_id, zona_id || null, financiador_id || null, dificil_acceso || 'no', porcentajeTotal, usuario_id, BusinessRules.versionado.versionInicial, BusinessRules.estados.iniciales[0]]);
    
    res.status(201).json({ id: result.insertId, version: 1 });
  } catch (error) {
    throw new AppError(500, 'Error al crear presupuesto');
  }
});

// Finalizar presupuesto (evaluar estado final, no crear versión)
export const finalizarPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const resultado = await presupuestoService.finalizar(id);
  
  res.json({
    success: true,
    estado: resultado.estadoFinal,
    tieneInsumosCriticos: resultado.tieneInsumosCriticos,
    totales: resultado.totales,
    mensaje: resultado.estadoFinal === 'pendiente' 
      ? 'Presupuesto enviado para auditoría' 
      : 'Presupuesto finalizado'
  });
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
  
  // Obtener presupuesto directamente sin recalcular (usa valores guardados en BD)
  const [rows] = await pool.query<any[]>(`
    SELECT 
      p.*, 
      s.Sucursales_mh as Sucursal,
      z.nombre as zona_nombre,
      f.Financiador, f.tasa_mensual, f.dias_cobranza_teorico, f.dias_cobranza_real,
      fa.nombre as acuerdo_nombre,
      u.username as usuario_creador
    FROM presupuestos p 
    LEFT JOIN sucursales_mh s ON p.sucursal_id = s.ID
    LEFT JOIN tarifario_zonas z ON p.zona_id = z.id
    LEFT JOIN financiador f ON p.financiador_id = f.id
    LEFT JOIN financiador_acuerdo fa ON f.id_acuerdo = fa.id_acuerdo
    LEFT JOIN usuarios u ON p.usuario_id = u.id
    WHERE p.idPresupuestos = ?
  `, [id]);

  if (rows.length === 0) {
    throw new AppError(404, 'Presupuesto no encontrado');
  }

  const presupuesto = rows[0];

  const prestaciones = await obtenerPrestacionesPresupuesto(id);
  const insumos = await obtenerInsumosPresupuesto(id);
  const equipamientos = await obtenerEquipamientosPresupuesto(id);

  res.json({
    ...presupuesto,
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

export const revertirABorrador = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const repo = new PresupuestoRepository();
  await repo.revertirABorrador(id);
  res.json({ success: true });
});

export const recalcularTotalesPresupuesto = asyncHandler(async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { presupuestoCalculosService } = await import('../services/presupuestoCalculosService');
  await presupuestoCalculosService.recalcularTotales(id);
  res.json({ success: true });
});
