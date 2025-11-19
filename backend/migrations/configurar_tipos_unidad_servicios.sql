-- Script para configurar tipo_unidad en servicios existentes
-- Ejecutar después de add_tipo_unidad_to_servicios.sql

-- ============================================
-- HORAS (servicios de atención continua)
-- ============================================
UPDATE servicios SET tipo_unidad = 'horas' 
WHERE nombre LIKE '%acompañ%' 
   OR nombre LIKE '%cuidador%'
   OR nombre LIKE '%enferm%'
   OR nombre LIKE '%asistencia%';

-- ============================================
-- SESIONES (terapias y tratamientos)
-- ============================================
UPDATE servicios SET tipo_unidad = 'sesiones' 
WHERE nombre LIKE '%sesion%' 
   OR nombre LIKE '%terapia%'
   OR nombre LIKE '%kinesiolog%'
   OR nombre LIKE '%fonoaudiolog%'
   OR nombre LIKE '%psicolog%'
   OR nombre LIKE '%terapia ocupacional%'
   OR nombre LIKE '%fisioterapia%';

-- ============================================
-- CONSULTAS (evaluaciones y visitas médicas)
-- ============================================
UPDATE servicios SET tipo_unidad = 'consultas' 
WHERE nombre LIKE '%consulta%' 
   OR nombre LIKE '%evaluacion%'
   OR nombre LIKE '%visita%'
   OR nombre LIKE '%control%'
   OR nombre LIKE '%medic%';

-- ============================================
-- DÍAS (internación, alquiler de equipos)
-- ============================================
UPDATE servicios SET tipo_unidad = 'días' 
WHERE nombre LIKE '%dia%' 
   OR nombre LIKE '%internacion%'
   OR nombre LIKE '%alquiler%'
   OR nombre LIKE '%cama%'
   OR nombre LIKE '%habitacion%';

-- ============================================
-- UNIDADES (productos, insumos, equipos)
-- ============================================
UPDATE servicios SET tipo_unidad = 'unidades' 
WHERE nombre LIKE '%unidad%' 
   OR nombre LIKE '%equipo%'
   OR nombre LIKE '%producto%'
   OR nombre LIKE '%dispositivo%';

-- ============================================
-- Configurar max_unidades_sugerido (ejemplos)
-- ============================================

-- Horas de acompañamiento: máximo 500 horas/mes
UPDATE servicios SET max_unidades_sugerido = 500 
WHERE tipo_unidad = 'horas' AND nombre LIKE '%acompañ%';

-- Sesiones de kinesiología: máximo 80 sesiones/mes
UPDATE servicios SET max_unidades_sugerido = 80 
WHERE tipo_unidad = 'sesiones' AND nombre LIKE '%kinesiolog%';

-- Consultas médicas: máximo 30 consultas/mes
UPDATE servicios SET max_unidades_sugerido = 30 
WHERE tipo_unidad = 'consultas';

-- Días de internación: máximo 30 días/mes
UPDATE servicios SET max_unidades_sugerido = 30 
WHERE tipo_unidad = 'días' AND nombre LIKE '%internacion%';

-- ============================================
-- Verificar resultados
-- ============================================
SELECT 
    tipo_unidad,
    COUNT(*) as cantidad_servicios,
    COUNT(max_unidades_sugerido) as con_limite_definido
FROM servicios
GROUP BY tipo_unidad
ORDER BY tipo_unidad;

-- Ver servicios sin tipo_unidad definido (deberían ser pocos)
SELECT id_servicio, nombre, tipo_unidad, max_unidades_sugerido
FROM servicios
WHERE tipo_unidad IS NULL OR tipo_unidad = 'horas'
ORDER BY nombre;
