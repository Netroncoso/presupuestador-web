-- Análisis detallado del tiempo de auditoría

-- 1. Ver presupuestos aprobados con sus tiempos
SELECT 
  p.idPresupuestos,
  p.Nombre_Apellido,
  MIN(a.fecha) as primera_auditoria,
  p.updated_at as fecha_aprobacion,
  TIMESTAMPDIFF(HOUR, MIN(a.fecha), p.updated_at) as horas_auditoria,
  TIMESTAMPDIFF(DAY, MIN(a.fecha), p.updated_at) as dias_auditoria,
  p.estado,
  COUNT(a.id) as cantidad_movimientos
FROM presupuestos p
INNER JOIN auditorias_presupuestos a ON p.idPresupuestos = a.presupuesto_id
WHERE p.estado IN ('aprobado', 'aprobado_condicional')
  AND p.es_ultima_version = 1
GROUP BY p.idPresupuestos
ORDER BY horas_auditoria DESC
LIMIT 20;

-- 2. Estadísticas generales
SELECT 
  COUNT(*) as total_presupuestos,
  AVG(horas) as promedio_horas,
  MIN(horas) as minimo_horas,
  MAX(horas) as maximo_horas,
  STDDEV(horas) as desviacion_estandar
FROM (
  SELECT 
    p.idPresupuestos,
    TIMESTAMPDIFF(HOUR, MIN(a.fecha), p.updated_at) as horas
  FROM presupuestos p
  INNER JOIN auditorias_presupuestos a ON p.idPresupuestos = a.presupuesto_id
  WHERE p.estado IN ('aprobado', 'aprobado_condicional')
    AND p.es_ultima_version = 1
  GROUP BY p.idPresupuestos
) sub;

-- 3. Ver si hay presupuestos con fechas muy antiguas
SELECT 
  p.idPresupuestos,
  p.created_at as creado,
  MIN(a.fecha) as primera_auditoria,
  p.updated_at as aprobado,
  TIMESTAMPDIFF(DAY, p.created_at, p.updated_at) as dias_totales
FROM presupuestos p
INNER JOIN auditorias_presupuestos a ON p.idPresupuestos = a.presupuesto_id
WHERE p.estado IN ('aprobado', 'aprobado_condicional')
  AND p.es_ultima_version = 1
GROUP BY p.idPresupuestos
HAVING dias_totales > 7
ORDER BY dias_totales DESC;

-- 4. Ver distribución de tiempos
SELECT 
  CASE 
    WHEN horas < 1 THEN '< 1 hora'
    WHEN horas < 24 THEN '1-24 horas'
    WHEN horas < 48 THEN '1-2 días'
    WHEN horas < 168 THEN '2-7 días'
    ELSE '> 7 días'
  END as rango,
  COUNT(*) as cantidad,
  AVG(horas) as promedio_horas
FROM (
  SELECT 
    TIMESTAMPDIFF(HOUR, MIN(a.fecha), p.updated_at) as horas
  FROM presupuestos p
  INNER JOIN auditorias_presupuestos a ON p.idPresupuestos = a.presupuesto_id
  WHERE p.estado IN ('aprobado', 'aprobado_condicional')
    AND p.es_ultima_version = 1
  GROUP BY p.idPresupuestos
) sub
GROUP BY rango
ORDER BY promedio_horas;
