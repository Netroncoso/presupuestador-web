-- Verificar tablas de backup en la base de datos
SHOW TABLES LIKE '%backup%';

-- Ver todas las tablas para identificar backups
SHOW TABLES;

-- Verificar tablas con sufijos _old, _bak, _temp
SHOW TABLES LIKE '%_old';
SHOW TABLES LIKE '%_bak';
SHOW TABLES LIKE '%_temp';
SHOW TABLES LIKE '%_backup';

-- Ver tamaño de tablas de backup (si existen)
SELECT 
    TABLE_NAME,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS 'Size (MB)',
    TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'mh_1'
    AND (
        TABLE_NAME LIKE '%backup%' 
        OR TABLE_NAME LIKE '%_old' 
        OR TABLE_NAME LIKE '%_bak'
        OR TABLE_NAME LIKE '%_temp'
    )
ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC;
