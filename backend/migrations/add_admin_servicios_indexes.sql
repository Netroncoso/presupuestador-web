-- ============================================
-- MIGRACIÓN: Índices para AdminServicios
-- Versión: 3.2
-- Fecha: Enero 2025
-- Objetivo: Optimizar consultas de servicios por prestador
-- ============================================

USE mh_1;

-- 1. prestador_servicio (JOIN principal)
CREATE INDEX idx_prestador_servicio_lookup
ON prestador_servicio(idobra_social, id_servicio);

-- 2. valores vigentes
CREATE INDEX idx_valores_vigentes
ON prestador_servicio_valores(id_prestador_servicio, fecha_fin);

-- 3. ordenamiento de servicios
CREATE INDEX idx_servicios_nombre
ON servicios(nombre);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver índices creados
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'mh_1'
  AND INDEX_NAME IN ('idx_prestador_servicio_lookup', 'idx_valores_vigentes', 'idx_servicios_nombre')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================
-- ROLLBACK (si es necesario)
-- ============================================

/*
DROP INDEX IF EXISTS idx_prestador_servicio_lookup ON prestador_servicio;
DROP INDEX IF EXISTS idx_valores_vigentes ON prestador_servicio_valores;
DROP INDEX IF EXISTS idx_servicios_nombre ON servicios;
*/