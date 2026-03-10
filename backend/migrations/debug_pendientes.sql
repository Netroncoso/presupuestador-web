-- Debug: Verificar presupuestos pendientes para gerencia_prestacional

-- 1. Presupuesto 554 específico
SELECT 
  idPresupuestos,
  Nombre_Apellido,
  estado,
  revisor_id,
  es_ultima_version,
  created_at
FROM presupuestos
WHERE idPresupuestos = 554;

-- 2. Todos los presupuestos pendiente_prestacional
SELECT 
  idPresupuestos,
  Nombre_Apellido,
  estado,
  revisor_id,
  es_ultima_version,
  created_at
FROM presupuestos
WHERE estado = 'pendiente_prestacional'
  AND es_ultima_version = 1
ORDER BY created_at ASC;

-- 3. Contar por condición
SELECT 
  'Total pendiente_prestacional' as descripcion,
  COUNT(*) as cantidad
FROM presupuestos
WHERE estado = 'pendiente_prestacional'
  AND es_ultima_version = 1

UNION ALL

SELECT 
  'Con revisor_id NULL' as descripcion,
  COUNT(*) as cantidad
FROM presupuestos
WHERE estado = 'pendiente_prestacional'
  AND es_ultima_version = 1
  AND revisor_id IS NULL

UNION ALL

SELECT 
  'Con revisor_id = 4' as descripcion,
  COUNT(*) as cantidad
FROM presupuestos
WHERE estado = 'pendiente_prestacional'
  AND es_ultima_version = 1
  AND revisor_id = 4;
