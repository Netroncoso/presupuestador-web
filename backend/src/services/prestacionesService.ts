import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../middleware/errorHandler';
import { cacheService } from './cacheService';

export class PrestacionesService {
  
  async obtenerFinanciadores() {
    const cacheKey = 'catalogos:financiadores';
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;
    
    const [rows] = await pool.query(
      'SELECT id, Financiador, activo FROM financiador ORDER BY activo DESC, Financiador'
    );
    
    cacheService.set(cacheKey, rows, 1800); // 30 min
    return rows;
  }

  async obtenerPrestacionesPorFinanciador(
    financiadorId: string, 
    fecha: string, 
    sucursalId: number | null,
    page: number = 1,
    limit: number = 100
  ) {
    const cacheKey = `prestaciones:${financiadorId}:${fecha}:${sucursalId}:${page}:${limit}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT 
        ps.id_servicio,
        s.nombre,
        s.tipo_unidad,
        ps.cant_total,
        COALESCE(
          (SELECT valor_asignado 
           FROM financiador_servicio_valores v 
           WHERE v.financiador_servicio_id = ps.id 
             AND (? IS NULL OR v.sucursal_id = ? OR v.sucursal_id IS NULL)
             AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
           ORDER BY 
             CASE WHEN v.sucursal_id = ? THEN 1 ELSE 2 END,
             v.fecha_inicio DESC
           LIMIT 1),
          ps.valor_sugerido
        ) AS valor_sugerido,
        COALESCE(
          (SELECT valor_facturar 
           FROM financiador_servicio_valores v 
           WHERE v.financiador_servicio_id = ps.id 
             AND (? IS NULL OR v.sucursal_id = ? OR v.sucursal_id IS NULL)
             AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
           ORDER BY 
             CASE WHEN v.sucursal_id = ? THEN 1 ELSE 2 END,
             v.fecha_inicio DESC
           LIMIT 1),
          ps.valor_facturar
        ) AS valor_facturar,
        COALESCE(
          (SELECT DATEDIFF(CURDATE(), MAX(fecha_inicio))
           FROM financiador_servicio_valores v
           WHERE v.financiador_servicio_id = ps.id
             AND (? IS NULL OR v.sucursal_id = ? OR v.sucursal_id IS NULL)),
          999
        ) AS dias_sin_actualizar
       FROM financiador_servicio AS ps
       JOIN servicios AS s ON ps.id_servicio = s.id_servicio
       WHERE ps.financiador_id = ? AND ps.activo = 1
       LIMIT ? OFFSET ?`, 
      [sucursalId, sucursalId, fecha, sucursalId, sucursalId, sucursalId, fecha, sucursalId, sucursalId, sucursalId, financiadorId, limit, offset]
    );

    const [[{ total }]] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM financiador_servicio ps WHERE ps.financiador_id = ? AND ps.activo = 1`,
      [financiadorId]
    );

    const result = {
      data: rows,
      pagination: {
        page,
        limit,
        total: total as number,
        totalPages: Math.ceil((total as number) / limit)
      }
    };
    
    cacheService.set(cacheKey, result, 900); // 15 min
    return result;
  }

  async obtenerFinanciadorInfo(financiadorId: string) {
    if (!financiadorId || isNaN(Number(financiadorId))) {
      throw new AppError(400, 'ID de financiador inválido');
    }

    const cacheKey = `catalogos:financiador:${financiadorId}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT 
         f.id, 
         f.Financiador, 
         f.activo, 
         f.tasa_mensual, 
         f.dias_cobranza_teorico, 
         f.dias_cobranza_real, 
         f.id_acuerdo, 
         COALESCE(a.nombre, NULL) as acuerdo_nombre
       FROM financiador f
       LEFT JOIN financiador_acuerdo a ON f.id_acuerdo = a.id_acuerdo
       WHERE f.id = ?`,
      [financiadorId]
    );
    
    if (rows.length === 0) {
      throw new AppError(404, 'Financiador no encontrado');
    }
    
    const financiadorInfo = rows[0];
    cacheService.set(cacheKey, financiadorInfo, 1800); // 30 min
    return financiadorInfo;
  }
}

export const prestacionesService = new PrestacionesService();
