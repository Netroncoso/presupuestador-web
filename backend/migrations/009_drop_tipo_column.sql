-- Eliminar columna tipo legacy de equipamientos
-- Esta migración es segura porque ya migramos todo a tipo_equipamiento_id

USE mh_1;

-- Verificar que todos los equipamientos tienen tipo_equipamiento_id
SELECT COUNT(*) as equipamientos_sin_tipo_id 
FROM equipamientos 
WHERE tipo_equipamiento_id IS NULL;

-- Si el resultado es 0, proceder con la eliminación
-- Si hay registros sin tipo_equipamiento_id, primero hay que corregirlos

-- Eliminar la columna tipo (legacy)
ALTER TABLE equipamientos DROP COLUMN tipo;

-- Verificar estructura final
DESCRIBE equipamientos;