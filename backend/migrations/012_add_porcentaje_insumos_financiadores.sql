-- Migración: Agregar porcentaje adicional de insumos por financiador
-- Fecha: 2025-01-XX
-- Descripción: Permite configurar un porcentaje adicional que se suma al porcentaje base
--              de insumos para cada financiador específico

ALTER TABLE financiador 
ADD COLUMN porcentaje_insumos DECIMAL(5,2) DEFAULT 0.00 
COMMENT 'Porcentaje adicional para cálculo de insumos (se suma al % base)';

-- Verificar que la columna se agregó correctamente
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_DEFAULT, 
    COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'financiador' 
  AND COLUMN_NAME = 'porcentaje_insumos';
