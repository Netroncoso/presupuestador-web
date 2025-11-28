-- Script para limpiar registros duplicados
-- Mantiene solo el registro más reciente (mayor id) por servicio

-- 1. Ver duplicados antes de limpiar
SELECT 
  id_prestador_servicio,
  COUNT(*) as total_registros,
  SUM(CASE WHEN fecha_fin IS NULL THEN 1 ELSE 0 END) as vigentes
FROM prestador_servicio_valores
GROUP BY id_prestador_servicio
HAVING COUNT(*) > 1;

-- 2. Eliminar duplicados, manteniendo solo el registro con mayor id
DELETE psv1 FROM prestador_servicio_valores psv1
JOIN (
  SELECT 
    id_prestador_servicio,
    MAX(id) as id_max
  FROM prestador_servicio_valores
  GROUP BY id_prestador_servicio
) psv2 ON psv1.id_prestador_servicio = psv2.id_prestador_servicio
WHERE psv1.id < psv2.id_max;

-- 3. Verificar que solo quede un registro por servicio
SELECT 
  id_prestador_servicio,
  COUNT(*) as total_registros
FROM prestador_servicio_valores
GROUP BY id_prestador_servicio
HAVING COUNT(*) > 1;
