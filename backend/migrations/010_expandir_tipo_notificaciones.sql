-- ============================================================================
-- MIGRACIÓN: Expandir campo tipo en notificaciones para sistema de carga
-- Fecha: Enero 2025
-- Base de datos: mh_1
-- ============================================================================

USE mh_1;

-- ============================================================================
-- EXPANDIR CAMPO TIPO EN NOTIFICACIONES
-- ============================================================================

-- El campo 'tipo' actual es muy corto para 'pendiente_carga'
-- Expandir de VARCHAR(20) a VARCHAR(50) para acomodar nuevos tipos

ALTER TABLE notificaciones MODIFY COLUMN tipo VARCHAR(50) NOT NULL;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar el cambio
SHOW COLUMNS FROM notificaciones LIKE 'tipo';

SELECT 'Campo tipo expandido exitosamente' AS resultado;