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
    zonaId: number | null,
    page: number = 1,
    limit: number = 100,
    search: string = ''
  ) {
    const cacheKey = `prestaciones:${financiadorId}:${fecha}:${zonaId}:${page}:${limit}:${search}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const offset = (page - 1) * limit;

    // Usar zona_id directamente (ya no mapear desde sucursal)
    const zonaFinal = zonaId || 1;

    let query = `SELECT 
        s.id as id_servicio,
        s.nombre,
        s.tipo_unidad,
        fs.codigo_financiador,
        fs.unidades_base,
        fs.admite_horas_nocturnas,
        COALESCE(
          (SELECT precio_facturar 
           FROM financiador_servicio_valores v 
           JOIN financiador_servicio fs2 ON v.financiador_servicio_id = fs2.id
           WHERE fs2.servicio_id = s.id
             AND fs2.financiador_id = ?
             AND v.zona_id = ?
             AND ? BETWEEN v.fecha_inicio AND COALESCE(v.fecha_fin, '9999-12-31')
           ORDER BY v.fecha_inicio DESC
           LIMIT 1),
          0
        ) AS valor_facturar,
        (SELECT costo_1 FROM tarifario_servicio_valores tsv 
         WHERE tsv.servicio_id = s.id AND tsv.zona_id = ? 
         AND CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31') LIMIT 1) AS costo_1,
        (SELECT costo_2 FROM tarifario_servicio_valores tsv 
         WHERE tsv.servicio_id = s.id AND tsv.zona_id = ? 
         AND CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31') LIMIT 1) AS costo_2,
        (SELECT costo_3 FROM tarifario_servicio_valores tsv 
         WHERE tsv.servicio_id = s.id AND tsv.zona_id = ? 
         AND CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31') LIMIT 1) AS costo_3,
        (SELECT costo_4 FROM tarifario_servicio_valores tsv 
         WHERE tsv.servicio_id = s.id AND tsv.zona_id = ? 
         AND CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31') LIMIT 1) AS costo_4,
        (SELECT costo_5 FROM tarifario_servicio_valores tsv 
         WHERE tsv.servicio_id = s.id AND tsv.zona_id = ? 
         AND CURDATE() BETWEEN tsv.fecha_inicio AND COALESCE(tsv.fecha_fin, '9999-12-31') LIMIT 1) AS costo_5,
        COALESCE(
          (SELECT DATEDIFF(CURDATE(), MAX(v.fecha_inicio))
           FROM financiador_servicio_valores v
           JOIN financiador_servicio fs2 ON v.financiador_servicio_id = fs2.id
           WHERE fs2.servicio_id = s.id
             AND fs2.financiador_id = ?
             AND v.zona_id = ?),
          999
        ) AS dias_sin_actualizar
       FROM servicios s
       JOIN financiador_servicio fs ON fs.servicio_id = s.id AND fs.financiador_id = ?
       WHERE s.activo = 1 AND fs.activo = 1`;

    const params: any[] = [financiadorId, zonaFinal, fecha, zonaFinal, zonaFinal, zonaFinal, zonaFinal, zonaFinal, financiadorId, zonaFinal, financiadorId];

    if (search) {
      query += ' AND s.nombre LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);

    let countQuery = `SELECT COUNT(*) as total 
       FROM servicios s
       WHERE s.activo = 1
         AND EXISTS (
           SELECT 1 FROM financiador_servicio fs 
           WHERE fs.servicio_id = s.id 
             AND fs.financiador_id = ? 
             AND fs.activo = 1
         )`;

    const countParams: any[] = [financiadorId];

    if (search) {
      countQuery += ' AND s.nombre LIKE ?';
      countParams.push(`%${search}%`);
    }

    const [[{ total }]] = await pool.query<RowDataPacket[]>(countQuery, countParams);

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
         f.porcentaje_insumos,
         f.porcentaje_horas_nocturnas,
         f.porcentaje_dificil_acceso,
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
