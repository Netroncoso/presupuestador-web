-- ============================================================================
-- MIGRACIÓN: Agregar columna resultado_auditoria
-- Fecha: Enero 2025
-- Propósito: Distinguir entre aprobado normal y aprobado condicional
-- ============================================================================

USE mh_1;

-- Agregar columna resultado_auditoria
ALTER TABLE presupuestos 
ADD COLUMN resultado_auditoria ENUM('aprobado', 'aprobado_condicional', 'rechazado') NULL 
COMMENT 'Resultado final de la auditoría (si aplica)'
AFTER estado;

-- Verificar que la columna se creó correctamente
SHOW COLUMNS FROM presupuestos LIKE 'resultado_auditoria';

SELECT 'Migración completada exitosamente' AS resultado;
