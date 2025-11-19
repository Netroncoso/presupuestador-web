-- Script para analizar estructura de base de datos
USE mh_1;

-- Ver todas las tablas
SHOW TABLES;

-- Estructura de tabla servicios
DESCRIBE servicios;

-- Estructura de tabla prestador_servicio
DESCRIBE prestador_servicio;

-- Estructura de tabla financiador
DESCRIBE financiador;

-- Estructura de tabla presupuestos
DESCRIBE presupuestos;

-- Estructura de tabla presupuesto_prestaciones
DESCRIBE presupuesto_prestaciones;

-- Estructura de tabla presupuesto_insumos
DESCRIBE presupuesto_insumos;

-- Ver todas las columnas de todas las tablas
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
