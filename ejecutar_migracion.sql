-- Conectar a la base de datos mh_1
USE mh_1;

-- Desactivar safe mode temporalmente
SET SQL_SAFE_UPDATES = 0;

-- Actualizar servicios existentes con valores por defecto según nombre
UPDATE servicios SET tipo_unidad = 'sesiones' WHERE nombre LIKE '%sesion%' OR nombre LIKE '%terapia%';
UPDATE servicios SET tipo_unidad = 'consultas' WHERE nombre LIKE '%consulta%' OR nombre LIKE '%evaluacion%';
UPDATE servicios SET tipo_unidad = 'días' WHERE nombre LIKE '%dia%' OR nombre LIKE '%internacion%';

-- Reactivar safe mode
SET SQL_SAFE_UPDATES = 1;

-- Verificar resultados
SELECT 'Migración completada exitosamente' as status;
SELECT tipo_unidad, COUNT(*) as cantidad FROM servicios GROUP BY tipo_unidad;
