-- Migración 012: Corregir inconsistencias de revisor_id en estados pendientes
-- Fecha: Enero 2025
-- Descripción: Limpia revisor_id de presupuestos en estado pendiente que no deberían tenerlo

-- Limpiar presupuestos pendientes con revisor asignado (inconsistencia)
UPDATE presupuestos 
SET revisor_id = NULL,
    revisor_asignado_at = NULL
WHERE revisor_id IS NOT NULL
  AND estado IN ('pendiente_prestacional', 'pendiente_comercial', 'pendiente_general');

-- Verificar resultado
SELECT 
  estado,
  COUNT(*) as total,
  SUM(CASE WHEN revisor_id IS NOT NULL THEN 1 ELSE 0 END) as con_revisor
FROM presupuestos
WHERE estado IN ('pendiente_prestacional', 'pendiente_comercial', 'pendiente_general')
GROUP BY estado;
