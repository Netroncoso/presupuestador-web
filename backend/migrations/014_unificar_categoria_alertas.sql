-- Migración: Estandarizar categoría de alertas
-- Fecha: Enero 2025
-- Descripción: Unifica 'alerta' y 'alertas' en una sola categoría 'alerta'

-- Cambiar todas las alertas a categoría 'alerta' (singular)
UPDATE configuracion_sistema 
SET categoria = 'alerta' 
WHERE categoria = 'alertas';

-- Verificar
SELECT categoria, COUNT(*) as total 
FROM configuracion_sistema 
WHERE categoria LIKE 'alert%' 
GROUP BY categoria;
