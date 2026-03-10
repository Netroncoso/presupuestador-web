-- ============================================================================
-- MIGRACIÓN: MAPEAR FINANCIADORES A ZONAS
-- ============================================================================
-- Fecha: Enero 2025
-- Descripción: Crear mapeos iniciales entre financiadores y zonas
-- ============================================================================

USE mh_1;

-- Iniciar transacción
START TRANSACTION;

-- Obtener todos los financiadores activos y mapearlos a zonas por defecto
INSERT IGNORE INTO financiador_zona_mapeo (financiador_id, zona_id, activo)
SELECT 
    f.id as financiador_id,
    1 as zona_id,  -- Zona 1 por defecto
    1 as activo
FROM financiador f
WHERE f.activo = 1;

-- Mapear algunos financiadores a múltiples zonas (ejemplo)
INSERT IGNORE INTO financiador_zona_mapeo (financiador_id, zona_id, activo)
SELECT 
    f.id as financiador_id,
    2 as zona_id,  -- Zona 2 adicional
    1 as activo
FROM financiador f
WHERE f.activo = 1 
AND f.id IN (1, 2, 3, 4, 5); -- Primeros 5 financiadores tienen acceso a zona 2

-- Confirmar transacción
COMMIT;

-- Verificar mapeos creados
SELECT 
    f.Financiador,
    fz.nombre as zona_nombre,
    fzm.activo
FROM financiador_zona_mapeo fzm
INNER JOIN financiador f ON fzm.financiador_id = f.id
INNER JOIN financiador_zonas fz ON fzm.zona_id = fz.id
WHERE fzm.activo = 1
ORDER BY f.Financiador, fz.nombre;

SELECT 'Mapeo de financiadores a zonas completado' as status;