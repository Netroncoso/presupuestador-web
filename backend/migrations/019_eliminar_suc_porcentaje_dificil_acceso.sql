-- ============================================================================
-- Migración 019: Eliminar columna obsoleta suc_porcentaje_dificil_acceso
-- ============================================================================
-- Fecha: 11 de Febrero de 2025
-- Descripción: Elimina la columna suc_porcentaje_dificil_acceso de sucursales_mh
--              ya que el porcentaje de difícil acceso ahora se maneja desde
--              financiador.porcentaje_dificil_acceso (migración 018)
-- ============================================================================

USE mh_1;

-- Eliminar columna obsoleta
ALTER TABLE sucursales_mh 
DROP COLUMN suc_porcentaje_dificil_acceso;

-- Verificación
SELECT 'Migración 019 completada: columna suc_porcentaje_dificil_acceso eliminada' as status;
