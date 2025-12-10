import { Request, Response } from 'express';
import { RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { asyncHandler, AppError } from '../middleware/errorHandler';

export const getPrestadores = asyncHandler(async (req: Request, res: Response) => {
  const [rows] = await pool.query('SELECT idobra_social, Financiador, activo FROM financiador ORDER BY activo DESC, Financiador');
  res.json(rows);
});

export const getPrestacionesPorPrestador = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const fecha = (req.query.fecha as string) || new Date().toISOString().slice(0, 10);
  const sucursalId = req.query.sucursal_id ? Number(req.query.sucursal_id) : null;
  
  const [rows] = await pool.query(
    `SELECT 
      ps.id_servicio,
      s.nombre,
      s.tipo_unidad,
      ps.cant_total,
      COALESCE(
        (SELECT valor_asignado 
         FROM prestador_servicio_valores v 
         WHERE v.id_prestador_servicio = ps.id_prestador_servicio 
           AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
           AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
         ORDER BY 
           CASE 
             WHEN v.sucursal_id IS NOT NULL 
               AND DATEDIFF(v.fecha_inicio, 
                 (SELECT MAX(v2.fecha_inicio) FROM prestador_servicio_valores v2 
                  WHERE v2.id_prestador_servicio = v.id_prestador_servicio 
                  AND v2.sucursal_id IS NULL 
                  AND ? BETWEEN v2.fecha_inicio AND COALESCE(v2.fecha_fin, '9999-12-31'))
               ) >= -30
             THEN 1
             ELSE 2
           END,
           v.fecha_inicio DESC
         LIMIT 1),
        ps.valor_sugerido
      ) AS valor_sugerido,
      COALESCE(
        (SELECT valor_facturar 
         FROM prestador_servicio_valores v 
         WHERE v.id_prestador_servicio = ps.id_prestador_servicio 
           AND (v.sucursal_id = ? OR v.sucursal_id IS NULL)
           AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
         ORDER BY 
           CASE 
             WHEN v.sucursal_id IS NOT NULL 
               AND DATEDIFF(v.fecha_inicio, 
                 (SELECT MAX(v2.fecha_inicio) FROM prestador_servicio_valores v2 
                  WHERE v2.id_prestador_servicio = v.id_prestador_servicio 
                  AND v2.sucursal_id IS NULL 
                  AND ? BETWEEN v2.fecha_inicio AND COALESCE(v2.fecha_fin, '9999-12-31'))
               ) >= -30
             THEN 1
             ELSE 2
           END,
           v.fecha_inicio DESC
         LIMIT 1),
        ps.valor_facturar
      ) AS valor_facturar
     FROM prestador_servicio AS ps
     JOIN servicios AS s ON ps.id_servicio = s.id_servicio
     WHERE ps.idobra_social = ? AND ps.activo = 1
     HAVING valor_facturar IS NOT NULL`, 
    [sucursalId, fecha, fecha, sucursalId, fecha, fecha, id]
  );
  res.json(rows);
});

export const getPrestadorInfo = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!id || isNaN(Number(id))) {
    throw new AppError(400, 'ID de prestador inválido');
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT 
       f.idobra_social, 
       f.Financiador, 
       f.activo, 
       f.tasa_mensual, 
       f.dias_cobranza_teorico, 
       f.dias_cobranza_real, 
       f.id_acuerdo, 
       COALESCE(a.nombre, NULL) as acuerdo_nombre
     FROM financiador f
     LEFT JOIN financiador_acuerdo a ON f.id_acuerdo = a.id_acuerdo
     WHERE f.idobra_social = ?`,
    [id]
  );
  
  if (rows.length === 0) {
    throw new AppError(404, 'Prestador no encontrado');
  }
  
  res.json(rows[0]);
});
