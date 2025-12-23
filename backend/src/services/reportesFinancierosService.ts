import { pool } from '../db';
import { RowDataPacket } from 'mysql2';
import { cacheService } from './cacheService';

export class ReportesFinancierosService {
  
  async obtenerKPIs(periodo: string = 'mes_actual') {
    const cacheKey = `reportes:kpis:${periodo}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const whereClause = this.getWhereClausePeriodo(periodo, false);
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_presupuestos,
        SUM(total_facturar) as facturacion_total,
        AVG(rentabilidad) as rentabilidad_promedio,
        AVG(rentabilidad_con_plazo) as rentabilidad_plazo_promedio,
        SUM(total_facturar - costo_total) as utilidad_total,
        SUM(CASE WHEN estado IN ('aprobado', 'aprobado_condicional') THEN 1 ELSE 0 END) as total_aprobados
      FROM presupuestos
      WHERE es_ultima_version = 1
        AND estado NOT IN ('borrador')
        ${whereClause}
    `);
    
    const kpis = rows[0];
    const tasaAprobacion = kpis.total_presupuestos > 0 
      ? (kpis.total_aprobados / kpis.total_presupuestos * 100) 
      : 0;
    
    // Tiempo promedio de auditoría
    const [tiempoRows] = await pool.query<RowDataPacket[]>(`
      SELECT AVG(horas) as horas_promedio
      FROM (
        SELECT TIMESTAMPDIFF(HOUR, MIN(a.fecha), p.updated_at) as horas
        FROM presupuestos p
        INNER JOIN auditorias_presupuestos a ON p.idPresupuestos = a.presupuesto_id
        WHERE p.estado IN ('aprobado', 'aprobado_condicional')
          AND p.es_ultima_version = 1
          ${whereClause.replace('WHERE', 'AND')}
        GROUP BY p.idPresupuestos
      ) sub
    `);
    
    const result = {
      facturacion_total: Number(kpis.facturacion_total) || 0,
      rentabilidad_promedio: Number(kpis.rentabilidad_promedio) || 0,
      rentabilidad_plazo_promedio: Number(kpis.rentabilidad_plazo_promedio) || 0,
      utilidad_total: Number(kpis.utilidad_total) || 0,
      tasa_aprobacion: tasaAprobacion,
      tiempo_auditoria_horas: Number(tiempoRows[0]?.horas_promedio) || 0
    };
    
    cacheService.set(cacheKey, result, 300);
    return result;
  }
  
  async obtenerRankingFinanciadores(periodo: string = 'mes_actual') {
    const cacheKey = `reportes:ranking-financiadores:${periodo}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const whereClause = this.getWhereClausePeriodo(periodo);
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        f.Financiador,
        f.dias_cobranza_real,
        f.dias_cobranza_teorico,
        fa.nombre as acuerdo,
        COUNT(p.idPresupuestos) as total_presupuestos,
        SUM(p.total_facturar) as facturacion_total,
        AVG(p.rentabilidad) as rentabilidad_promedio,
        COALESCE(f.dias_cobranza_real, f.dias_cobranza_teorico, 30) as dias_cobranza
      FROM presupuestos p
      INNER JOIN financiador f ON p.idobra_social = f.idobra_social
      LEFT JOIN financiador_acuerdo fa ON f.id_acuerdo = fa.id_acuerdo
      WHERE p.es_ultima_version = 1
        AND p.estado IN ('aprobado', 'aprobado_condicional')
        ${whereClause}
      GROUP BY f.idobra_social
      ORDER BY facturacion_total DESC
      LIMIT 10
    `);
    
    cacheService.set(cacheKey, rows, 300);
    return rows;
  }
  
  async obtenerRankingSucursales(periodo: string = 'mes_actual') {
    const cacheKey = `reportes:ranking-sucursales:${periodo}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const whereClause = this.getWhereClausePeriodo(periodo, true);
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        s.Sucursales_mh as sucursal,
        COUNT(p.idPresupuestos) as total_presupuestos,
        SUM(p.total_facturar) as facturacion_total,
        AVG(p.rentabilidad) as rentabilidad_promedio,
        AVG(p.total_facturar) as ticket_promedio,
        SUM(CASE WHEN p.estado IN ('aprobado', 'aprobado_condicional') THEN 1 ELSE 0 END) as total_aprobados
      FROM presupuestos p
      INNER JOIN sucursales_mh s ON p.sucursal_id = s.ID
      WHERE p.es_ultima_version = 1
        AND p.estado NOT IN ('borrador')
        ${whereClause}
      GROUP BY p.sucursal_id
      ORDER BY facturacion_total DESC
    `);
    
    const result = rows.map(row => ({
      ...row,
      tasa_aprobacion: row.total_presupuestos > 0 
        ? (row.total_aprobados / row.total_presupuestos * 100) 
        : 0
    }));
    
    cacheService.set(cacheKey, result, 300);
    return result;
  }
  
  async obtenerAnalisisCostos(financiadorId?: string, servicioId?: string, periodo: string = 'mes_actual', page: number = 1, limit: number = 100) {
    const whereClause = this.getWhereClausePeriodo(periodo);
    const params: any[] = [];
    
    let filtroFinanciador = '';
    if (financiadorId) {
      filtroFinanciador = 'AND f.idobra_social = ?';
      params.push(financiadorId);
    }
    
    let filtroServicio = '';
    if (servicioId) {
      filtroServicio = 'AND s.id_servicio = ?';
      params.push(servicioId);
    }
    
    const offset = (page - 1) * limit;
    
    const [countRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT CONCAT(f.idobra_social, '-', s.id_servicio)) as total
      FROM presupuesto_prestaciones pp
      INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
      INNER JOIN servicios s ON pp.id_servicio = s.id_servicio
      INNER JOIN financiador f ON p.idobra_social = f.idobra_social
      WHERE p.estado IN ('aprobado', 'aprobado_condicional')
        AND p.es_ultima_version = 1
        ${whereClause}
        ${filtroFinanciador}
        ${filtroServicio}
    `, params);
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        f.Financiador,
        s.nombre as servicio,
        s.tipo_unidad,
        COUNT(pp.id) as veces_usado,
        AVG(pp.valor_asignado) as valor_asignado_promedio,
        AVG(pp.valor_facturar) as valor_facturar_promedio,
        AVG((pp.valor_facturar - pp.valor_asignado) / pp.valor_asignado * 100) as margen_promedio,
        MAX(p.created_at) as ultima_vez_usado
      FROM presupuesto_prestaciones pp
      INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
      INNER JOIN servicios s ON pp.id_servicio = s.id_servicio
      INNER JOIN financiador f ON p.idobra_social = f.idobra_social
      WHERE p.estado IN ('aprobado', 'aprobado_condicional')
        AND p.es_ultima_version = 1
        ${whereClause}
        ${filtroFinanciador}
        ${filtroServicio}
      GROUP BY f.idobra_social, s.id_servicio
      ORDER BY veces_usado DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    return {
      data: rows,
      total: countRows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }
  
  async obtenerPromediosGenerales(servicioId?: string, periodo: string = 'mes_actual', page: number = 1, limit: number = 100) {
    const whereClause = this.getWhereClausePeriodo(periodo);
    const params: any[] = [];
    
    let filtroServicio = '';
    if (servicioId) {
      filtroServicio = 'AND s.id_servicio = ?';
      params.push(servicioId);
    }
    
    const offset = (page - 1) * limit;
    
    const [countRows] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(DISTINCT s.id_servicio) as total
      FROM presupuesto_prestaciones pp
      INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
      INNER JOIN servicios s ON pp.id_servicio = s.id_servicio
      WHERE p.estado IN ('aprobado', 'aprobado_condicional')
        AND p.es_ultima_version = 1
        ${whereClause}
        ${filtroServicio}
    `, params);
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT 
        s.nombre as servicio,
        s.tipo_unidad,
        COUNT(pp.id) as veces_usado,
        AVG(pp.valor_asignado) as valor_asignado_promedio,
        AVG(pp.valor_facturar) as valor_facturar_promedio,
        AVG((pp.valor_facturar - pp.valor_asignado) / pp.valor_asignado * 100) as margen_promedio
      FROM presupuesto_prestaciones pp
      INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
      INNER JOIN servicios s ON pp.id_servicio = s.id_servicio
      WHERE p.estado IN ('aprobado', 'aprobado_condicional')
        AND p.es_ultima_version = 1
        ${whereClause}
        ${filtroServicio}
      GROUP BY s.id_servicio
      ORDER BY veces_usado DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    return {
      data: rows,
      total: countRows[0].total,
      page,
      limit,
      totalPages: Math.ceil(countRows[0].total / limit)
    };
  }
  
  async obtenerServiciosPorFinanciador(financiadorId: string, periodo: string = 'mes_actual') {
    const whereClause = this.getWhereClausePeriodo(periodo);
    const params: any[] = [financiadorId];
    
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT
        s.id_servicio,
        s.nombre
      FROM presupuesto_prestaciones pp
      INNER JOIN presupuestos p ON pp.idPresupuestos = p.idPresupuestos
      INNER JOIN servicios s ON pp.id_servicio = s.id_servicio
      INNER JOIN financiador f ON p.idobra_social = f.idobra_social
      WHERE p.estado IN ('aprobado', 'aprobado_condicional')
        AND p.es_ultima_version = 1
        AND f.idobra_social = ?
        ${whereClause}
      ORDER BY s.nombre
    `, params);
    
    return rows;
  }
  
  private getWhereClausePeriodo(periodo: string, useAlias: boolean = true): string {
    const hoy = new Date();
    const col = useAlias ? 'p.created_at' : 'created_at';
    
    switch (periodo) {
      case 'mes_actual':
        return `AND YEAR(${col}) = ${hoy.getFullYear()} AND MONTH(${col}) = ${hoy.getMonth() + 1}`;
      case 'trimestre_actual':
        const trimestre = Math.floor(hoy.getMonth() / 3);
        const mesInicio = trimestre * 3 + 1;
        const mesFin = mesInicio + 2;
        return `AND YEAR(${col}) = ${hoy.getFullYear()} AND MONTH(${col}) BETWEEN ${mesInicio} AND ${mesFin}`;
      case 'anio_actual':
        return `AND YEAR(${col}) = ${hoy.getFullYear()}`;
      case 'ultimos_6_meses':
        return `AND ${col} >= DATE_SUB(NOW(), INTERVAL 6 MONTH)`;
      case 'todo':
        return '';
      default:
        return `AND YEAR(${col}) = ${hoy.getFullYear()} AND MONTH(${col}) = ${hoy.getMonth() + 1}`;
    }
  }
}
