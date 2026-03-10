-- PREVIEW: Servicios que se consolidarían
-- NO EJECUTA CAMBIOS, solo muestra qué pasaría

-- 1. Servicios duplicados (CON código que se eliminarían)
SELECT 
  s_con_codigo.id as id_eliminar,
  s_con_codigo.nombre,
  s_con_codigo.codigo_financiador,
  s_sin_codigo.id as id_mantener,
  'ELIMINAR → MANTENER' as accion
FROM servicios s_con_codigo
JOIN servicios s_sin_codigo ON s_con_codigo.nombre = s_sin_codigo.nombre 
  AND s_sin_codigo.codigo_financiador IS NULL
WHERE s_con_codigo.codigo_financiador IS NOT NULL
ORDER BY s_con_codigo.nombre;

-- 2. Conteo de registros afectados en financiador_servicio
SELECT 
  COUNT(*) as total_relaciones_afectadas,
  'financiador_servicio' as tabla
FROM financiador_servicio fs
JOIN servicios s_con_codigo ON fs.servicio_id = s_con_codigo.id
JOIN servicios s_sin_codigo ON s_con_codigo.nombre = s_sin_codigo.nombre 
  AND s_sin_codigo.codigo_financiador IS NULL
WHERE s_con_codigo.codigo_financiador IS NOT NULL

UNION ALL

-- 3. Conteo de registros afectados en presupuesto_prestaciones
SELECT 
  COUNT(*) as total_registros_afectados,
  'presupuesto_prestaciones' as tabla
FROM presupuesto_prestaciones pp
JOIN servicios s_con_codigo ON pp.servicio_id = s_con_codigo.id
JOIN servicios s_sin_codigo ON s_con_codigo.nombre = s_sin_codigo.nombre 
  AND s_sin_codigo.codigo_financiador IS NULL
WHERE s_con_codigo.codigo_financiador IS NOT NULL

UNION ALL

-- 4. Conteo de registros afectados en tarifario_servicio_valores
SELECT 
  COUNT(*) as total_registros_afectados,
  'tarifario_servicio_valores' as tabla
FROM tarifario_servicio_valores tsv
JOIN servicios s_con_codigo ON tsv.servicio_id = s_con_codigo.id
JOIN servicios s_sin_codigo ON s_con_codigo.nombre = s_sin_codigo.nombre 
  AND s_sin_codigo.codigo_financiador IS NULL
WHERE s_con_codigo.codigo_financiador IS NOT NULL;

-- 5. Total de servicios a eliminar
SELECT 
  COUNT(*) as total_servicios_eliminar
FROM servicios 
WHERE codigo_financiador IS NOT NULL 
  AND nombre IN (SELECT nombre FROM servicios WHERE codigo_financiador IS NULL);
