-- Migración: Agregar columna id_softwerk a tabla insumos
-- Fecha: 2026-02-12

-- Agregar columna id_softwerk si no existe
ALTER TABLE insumos 
ADD COLUMN IF NOT EXISTS id_softwerk INT NULL AFTER critico;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_id_softwerk ON insumos(id_softwerk);
CREATE INDEX IF NOT EXISTS idx_codigo_producto ON insumos(codigo_producto);
