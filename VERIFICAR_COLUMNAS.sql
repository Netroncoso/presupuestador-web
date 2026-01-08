-- Verificar columnas actuales en las tablas
USE mh_1;

SELECT 'financiador_servicio' as tabla, COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'financiador_servicio'
ORDER BY ORDINAL_POSITION;

SELECT 'financiador_equipamiento' as tabla, COLUMN_NAME, COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'financiador_equipamiento'
ORDER BY ORDINAL_POSITION;
