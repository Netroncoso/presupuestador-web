-- Script para verificar que todas las tablas usan las columnas correctas
-- Ejecutar después de reiniciar el backend

-- Verificar estructura de financiador
SELECT 'financiador' as tabla, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'financiador' AND COLUMN_NAME IN ('id', 'idobra_social');

-- Verificar estructura de financiador_servicio  
SELECT 'financiador_servicio' as tabla, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'financiador_servicio' AND COLUMN_NAME IN ('id', 'financiador_id', 'idobra_social');

-- Verificar estructura de financiador_equipamiento
SELECT 'financiador_equipamiento' as tabla, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'financiador_equipamiento' AND COLUMN_NAME IN ('id', 'financiador_id', 'idobra_social');

-- Verificar estructura de presupuestos
SELECT 'presupuestos' as tabla, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND COLUMN_NAME IN ('financiador_id', 'idobra_social');
