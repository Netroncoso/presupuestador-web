-- ============================================================================
-- Migration 020: Agregar codigo_financiador a tabla servicios
-- ============================================================================
-- Fecha: Febrero 2025
-- Descripción: Agrega campo codigo_financiador para identificación externa

ALTER TABLE servicios
ADD COLUMN codigo_financiador VARCHAR(50) NULL COMMENT 'Código de identificación del financiador/obra social'
AFTER descripcion;

-- Índice para búsquedas por código
CREATE INDEX idx_servicios_codigo_financiador ON servicios(codigo_financiador);
