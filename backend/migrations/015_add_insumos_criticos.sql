-- ============================================
-- Migración: Insumos Críticos
-- Fecha: Enero 2025
-- Descripción: Agregar columna critico a tabla insumos
--              para forzar auditoría obligatoria
-- ============================================

USE mh_1;

-- Agregar columna critico
ALTER TABLE insumos 
ADD COLUMN critico TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Insumo crítico que fuerza auditoría obligatoria';

-- Índice para optimizar consultas de insumos críticos
CREATE INDEX idx_insumos_critico ON insumos(critico);

-- Verificar resultado
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'insumos' 
  AND COLUMN_NAME = 'critico';
