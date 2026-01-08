-- ============================================================================
-- MIGRACIÓN: Eliminar columnas obsoletas después de estandarización
-- ============================================================================
-- IMPORTANTE: Ejecutar SOLO después de verificar que el backend funciona correctamente
-- con las nuevas columnas (financiador_id en lugar de idobra_social)

USE mh_1;

-- Paso 1: Verificar que NO hay valores NULL en las nuevas columnas
SELECT 'Verificando financiador_servicio...' as paso;
SELECT COUNT(*) as registros_con_null 
FROM financiador_servicio 
WHERE financiador_id IS NULL;

SELECT 'Verificando financiador_equipamiento...' as paso;
SELECT COUNT(*) as registros_con_null 
FROM financiador_equipamiento 
WHERE financiador_id IS NULL;

-- Paso 2: Eliminar columnas obsoletas (DROP COLUMN elimina FK automáticamente)
ALTER TABLE financiador_servicio DROP COLUMN idobra_social;
ALTER TABLE financiador_equipamiento DROP COLUMN idobra_social;

-- Verificar resultado
SELECT 'Columnas eliminadas exitosamente' as resultado;
SHOW COLUMNS FROM financiador_servicio;
SHOW COLUMNS FROM financiador_equipamiento;
