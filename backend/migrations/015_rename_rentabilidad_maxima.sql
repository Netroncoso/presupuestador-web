-- Migración: Renombrar regla de rentabilidad máxima
-- Fecha: Enero 2025
-- Descripción: Cambia rentabilidadConPlazoMaxima a rentabilidadMaxima (ahora evalúa SIN plazo)

-- Renombrar clave para claridad
UPDATE configuracion_sistema 
SET clave = 'auditoria.rentabilidadMaxima',
    descripcion = 'Rentabilidad máxima para evitar auditoría'
WHERE clave = 'auditoria.rentabilidadConPlazoMaxima';

-- Verificar
SELECT clave, valor, descripcion 
FROM configuracion_sistema 
WHERE clave LIKE '%rentabilidad%' AND categoria = 'auditoria';
