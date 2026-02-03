-- ============================================================================
-- CORRECCIÓN: TIPOS DE UNIDAD EN TARIFARIO_SERVICIO
-- ============================================================================
-- Corrige los tipos de unidad según el tipo de servicio
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- 1. ACTUALIZAR SERVICIOS DE VISITAS → consultas
-- ============================================================================

UPDATE tarifario_servicio 
SET tipo_unidad = 'consultas' 
WHERE nombre LIKE 'Visita%';

-- 2. ACTUALIZAR SERVICIOS DE TERAPIA → sesiones
-- ============================================================================

UPDATE tarifario_servicio 
SET tipo_unidad = 'sesiones' 
WHERE nombre IN (
    'Kinesiologia',
    'Fonoaudiologia',
    'Terapia Ocupacional'
);

-- 3. VERIFICACIÓN
-- ============================================================================

SELECT 
    id,
    nombre,
    tipo_unidad,
    activo
FROM tarifario_servicio
ORDER BY tipo_unidad, nombre;

-- Resultado esperado:
-- Hora Cuidador, Hora Enfermeria → tipo_unidad = 'horas'
-- Visita Enfermeria, Visita Medica → tipo_unidad = 'consultas'
-- Kinesiologia, Fonoaudiologia, Terapia Ocupacional → tipo_unidad = 'sesiones'
