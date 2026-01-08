-- ============================================
-- Migración 010: Eliminar tablas de backup
-- ============================================
-- Elimina tablas de backup creadas durante la migración
-- financiador_id que ya no son necesarias
-- ============================================

USE mh_1;

-- Verificar tablas antes de eliminar
SELECT 
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size (MB)',
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mh_1'
    AND TABLE_NAME IN (
        'backup_presupuestos_fase1',
        'backup_financiador_equipamiento_fk',
        'backup_prestador_servicio',
        'backup_prestador_servicio_valores',
        'backup_presupuestos_financiador'
    );

-- Eliminar tablas de backup
DROP TABLE IF EXISTS backup_presupuestos_fase1;
DROP TABLE IF EXISTS backup_financiador_equipamiento_fk;
DROP TABLE IF EXISTS backup_prestador_servicio;
DROP TABLE IF EXISTS backup_prestador_servicio_valores;
DROP TABLE IF EXISTS backup_presupuestos_financiador;

-- Verificar que se eliminaron correctamente
SELECT COUNT(*) as tablas_backup_restantes
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mh_1'
    AND TABLE_NAME LIKE '%backup%';

-- Resultado esperado: 0

SELECT '✅ Tablas de backup eliminadas correctamente' AS resultado;
