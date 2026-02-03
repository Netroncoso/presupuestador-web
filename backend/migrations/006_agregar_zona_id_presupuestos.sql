-- ============================================================================
-- MIGRATION: Agregar zona_id a tabla presupuestos
-- ============================================================================

ALTER TABLE presupuestos 
ADD COLUMN zona_id INT NULL AFTER sucursal_id,
ADD CONSTRAINT fk_presupuestos_zona 
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id);

-- Crear índice para mejorar performance
CREATE INDEX idx_presupuestos_zona ON presupuestos(zona_id);
