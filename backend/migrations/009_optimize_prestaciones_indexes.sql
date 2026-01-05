-- ============================================================================
-- Migración: Optimización de Índices para Prestaciones
-- Fecha: Enero 2025
-- Descripción: Mejora performance de queries de valores históricos
-- ============================================================================

USE mh_1;

-- ============================================================================
-- PASO 1: Optimizar índice de prestador_servicio
-- ============================================================================

-- Verificar índice actual
SHOW INDEX FROM prestador_servicio WHERE Key_name = 'idx_prestador_servicio_lookup';

-- Eliminar índice viejo
DROP INDEX idx_prestador_servicio_lookup ON prestador_servicio;

-- Crear índice optimizado (agrega columna 'activo')
CREATE INDEX idx_prestador_servicio_lookup ON prestador_servicio(idobra_social, activo, id_servicio);

-- Verificar nuevo índice (debe mostrar 3 filas)
SHOW INDEX FROM prestador_servicio WHERE Key_name = 'idx_prestador_servicio_lookup';

-- ============================================================================
-- PASO 2: Optimizar índice de valores históricos
-- ============================================================================

-- Verificar índice actual
SHOW INDEX FROM prestador_servicio_valores WHERE Key_name = 'idx_valores_vigentes';

-- Eliminar índice viejo
DROP INDEX idx_valores_vigentes ON prestador_servicio_valores;

-- Crear índice optimizado (agrega sucursal_id y fecha_inicio)
CREATE INDEX idx_valores_vigentes ON prestador_servicio_valores(id_prestador_servicio, sucursal_id, fecha_inicio, fecha_fin);

-- Verificar nuevo índice (debe mostrar 4 filas)
SHOW INDEX FROM prestador_servicio_valores WHERE Key_name = 'idx_valores_vigentes';

-- ============================================================================
-- Impacto esperado:
-- - Query principal: ~20% más rápida con 'activo' en índice
-- - Subqueries: ~30% más rápidas con sucursal_id y fecha_inicio
-- - Reducción de full table scans en valores históricos
-- ============================================================================
