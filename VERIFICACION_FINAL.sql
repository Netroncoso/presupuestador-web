-- VERIFICACIÓN FINAL: Todas las tablas deben usar las columnas correctas
USE mh_1;

-- 1. Verificar que financiador_servicio NO tiene idobra_social
SELECT 'financiador_servicio' as tabla, 
       COUNT(*) as tiene_columna_obsoleta
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'financiador_servicio' 
  AND COLUMN_NAME = 'idobra_social';
-- Resultado esperado: 0

-- 2. Verificar que financiador_equipamiento NO tiene idobra_social  
SELECT 'financiador_equipamiento' as tabla,
       COUNT(*) as tiene_columna_obsoleta
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'financiador_equipamiento' 
  AND COLUMN_NAME = 'idobra_social';
-- Resultado esperado: 0

-- 3. Verificar estructura correcta
SELECT 'ESTRUCTURA CORRECTA' as verificacion;
SELECT TABLE_NAME, COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME IN ('financiador', 'financiador_servicio', 'financiador_equipamiento', 'presupuestos')
  AND COLUMN_NAME IN ('id', 'financiador_id')
ORDER BY TABLE_NAME, COLUMN_NAME;
