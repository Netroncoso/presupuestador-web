-- Eliminar columnas innecesarias de la base de datos
USE mh_1;

-- Eliminar columnas de prestador_servicio
ALTER TABLE prestador_servicio
DROP COLUMN total_mes,
DROP COLUMN condicion;

-- Eliminar columna de servicios
ALTER TABLE servicios
DROP COLUMN max_unidades_sugerido;

-- Verificar cambios
DESCRIBE prestador_servicio;
DESCRIBE servicios;

SELECT 'Columnas eliminadas exitosamente' as status;
