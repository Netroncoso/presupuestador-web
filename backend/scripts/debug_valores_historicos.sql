-- Script para debuggear valores históricos de servicios
-- Buscar "Sesion de enfermeria"

-- 1. Encontrar el servicio
SELECT id_servicio, nombre, tipo_unidad 
FROM servicios 
WHERE nombre LIKE '%enfermeria%';

-- 2. Ver relaciones prestador_servicio
SELECT ps.id_prestador_servicio, ps.id_servicio, ps.idobra_social, 
       s.nombre as servicio, f.Financiador,
       ps.activo, ps.valor_facturar, ps.valor_sugerido
FROM prestador_servicio ps
JOIN servicios s ON ps.id_servicio = s.id_servicio
JOIN financiador f ON ps.idobra_social = f.idobra_social
WHERE s.nombre LIKE '%enfermeria%';

-- 3. Ver TODOS los valores históricos de estos servicios
SELECT 
  psv.id,
  psv.id_prestador_servicio,
  s.nombre as servicio,
  f.Financiador,
  COALESCE(suc.Sucursales_mh, 'TODAS') as sucursal,
  psv.valor_asignado,
  psv.valor_facturar,
  psv.fecha_inicio,
  psv.fecha_fin,
  DATEDIFF(CURDATE(), psv.fecha_inicio) as dias_desde_inicio,
  psv.created_at
FROM prestador_servicio_valores psv
JOIN prestador_servicio ps ON psv.id_prestador_servicio = ps.id_prestador_servicio
JOIN servicios s ON ps.id_servicio = s.id_servicio
JOIN financiador f ON ps.idobra_social = f.idobra_social
LEFT JOIN sucursales_mh suc ON psv.sucursal_id = suc.ID
WHERE s.nombre LIKE '%enfermeria%'
ORDER BY ps.id_prestador_servicio, psv.sucursal_id, psv.fecha_inicio DESC;

-- 4. Ver valores VIGENTES HOY por sucursal
SELECT 
  ps.id_prestador_servicio,
  s.nombre as servicio,
  f.Financiador,
  COALESCE(suc.Sucursales_mh, 'TODAS') as sucursal,
  psv.valor_facturar,
  psv.fecha_inicio,
  psv.fecha_fin,
  DATEDIFF(CURDATE(), psv.fecha_inicio) as dias_desde_inicio
FROM prestador_servicio ps
JOIN servicios s ON ps.id_servicio = s.id_servicio
JOIN financiador f ON ps.idobra_social = f.idobra_social
JOIN prestador_servicio_valores psv ON psv.id_prestador_servicio = ps.id_prestador_servicio
LEFT JOIN sucursales_mh suc ON psv.sucursal_id = suc.ID
WHERE s.nombre LIKE '%enfermeria%'
  AND CURDATE() BETWEEN psv.fecha_inicio AND COALESCE(psv.fecha_fin, '9999-12-31')
ORDER BY ps.id_prestador_servicio, psv.sucursal_id;

-- 5. Simular el cálculo de dias_sin_actualizar (SIN filtro de sucursal - VIEJO)
SELECT 
  ps.id_prestador_servicio,
  s.nombre as servicio,
  f.Financiador,
  COALESCE(
    (SELECT DATEDIFF(CURDATE(), MAX(fecha_inicio))
     FROM prestador_servicio_valores v
     WHERE v.id_prestador_servicio = ps.id_prestador_servicio),
    999
  ) AS dias_sin_actualizar_VIEJO
FROM prestador_servicio ps
JOIN servicios s ON ps.id_servicio = s.id_servicio
JOIN financiador f ON ps.idobra_social = f.idobra_social
WHERE s.nombre LIKE '%enfermeria%';

-- 6. Simular el cálculo de dias_sin_actualizar (CON filtro de sucursal - NUEVO)
-- Probar con sucursal_id = 1 (ajustar según tu caso)
SET @sucursal_test = 1;

SELECT 
  ps.id_prestador_servicio,
  s.nombre as servicio,
  f.Financiador,
  COALESCE(
    (SELECT DATEDIFF(CURDATE(), MAX(fecha_inicio))
     FROM prestador_servicio_valores v
     WHERE v.id_prestador_servicio = ps.id_prestador_servicio
       AND (v.sucursal_id = @sucursal_test OR v.sucursal_id IS NULL)),
    999
  ) AS dias_sin_actualizar_NUEVO_suc1
FROM prestador_servicio ps
JOIN servicios s ON ps.id_servicio = s.id_servicio
JOIN financiador f ON ps.idobra_social = f.idobra_social
WHERE s.nombre LIKE '%enfermeria%';
