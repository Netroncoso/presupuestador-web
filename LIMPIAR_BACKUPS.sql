-- ============================================
-- SCRIPT DE LIMPIEZA DE TABLAS DE BACKUP
-- ============================================
-- IMPORTANTE: Ejecutar solo después de verificar que:
-- 1. La migración está completa y funcional
-- 2. Tienes un backup completo de la base de datos
-- 3. Han pasado al menos 2 semanas sin problemas
-- ============================================

USE mh_1;

-- Paso 1: Verificar qué tablas se eliminarán
SELECT 
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size (MB)',
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mh_1'
    AND (
        TABLE_NAME LIKE '%backup%' 
        OR TABLE_NAME LIKE '%_old' 
        OR TABLE_NAME LIKE '%_bak'
        OR TABLE_NAME LIKE '%_temp'
    )
ORDER BY CREATE_TIME DESC;

-- Paso 2: Descomentar las siguientes líneas para eliminar
-- (Elimina solo las que confirmes que son backups)

-- Tablas de migración prestador → financiador (si existen)
-- DROP TABLE IF EXISTS prestador_servicio_backup;
-- DROP TABLE IF EXISTS prestador_servicio_valores_backup;
-- DROP TABLE IF EXISTS prestadores_backup;
-- DROP TABLE IF EXISTS obra_social_backup;

-- Tablas temporales de migraciones anteriores
-- DROP TABLE IF EXISTS presupuestos_old;
-- DROP TABLE IF EXISTS presupuestos_backup;
-- DROP TABLE IF EXISTS auditorias_presupuestos_old;
-- DROP TABLE IF EXISTS auditorias_presupuestos_backup;
-- DROP TABLE IF EXISTS equipamientos_backup;
-- DROP TABLE IF EXISTS equipamientos_old;
-- DROP TABLE IF EXISTS insumos_backup;
-- DROP TABLE IF EXISTS usuarios_backup;

-- Paso 3: Verificar que se eliminaron
SELECT 
    TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mh_1'
    AND (
        TABLE_NAME LIKE '%backup%' 
        OR TABLE_NAME LIKE '%_old' 
        OR TABLE_NAME LIKE '%_bak'
        OR TABLE_NAME LIKE '%_temp'
    );

-- Si no devuelve resultados, la limpieza fue exitosa
