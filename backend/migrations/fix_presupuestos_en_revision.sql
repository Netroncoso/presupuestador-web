-- Script para corregir presupuestos atascados en estado 'en_revision'
-- Estos presupuestos quedaron en este estado debido a un bug en el parseo del frontend
-- que ha sido corregido. Este script los devuelve a 'pendiente' para que puedan ser auditados.

-- Ver presupuestos afectados
SELECT 
    idPresupuestos, 
    version, 
    estado, 
    Nombre_Apellido, 
    created_at,
    DATEDIFF(NOW(), created_at) as dias_pendiente
FROM presupuestos 
WHERE estado = 'en_revision' 
AND es_ultima_version = 1
ORDER BY created_at ASC;

-- Actualizar presupuestos de 'en_revision' a 'pendiente'
UPDATE presupuestos 
SET estado = 'pendiente' 
WHERE estado = 'en_revision' 
AND es_ultima_version = 1;

-- Verificar cambios
SELECT 
    COUNT(*) as total_actualizados
FROM presupuestos 
WHERE estado = 'pendiente' 
AND es_ultima_version = 1;
