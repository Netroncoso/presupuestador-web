-- Agregar tipo_unidad y max_unidades_sugerido a tabla servicios
ALTER TABLE servicios 
ADD COLUMN tipo_unidad ENUM('horas', 'sesiones', 'consultas', 'días', 'unidades') DEFAULT 'horas',
ADD COLUMN max_unidades_sugerido INT DEFAULT NULL;

-- Actualizar servicios existentes con valores por defecto según nombre
UPDATE servicios SET tipo_unidad = 'sesiones' WHERE nombre LIKE '%sesion%' OR nombre LIKE '%terapia%';
UPDATE servicios SET tipo_unidad = 'consultas' WHERE nombre LIKE '%consulta%' OR nombre LIKE '%evaluacion%';
UPDATE servicios SET tipo_unidad = 'días' WHERE nombre LIKE '%dia%' OR nombre LIKE '%internacion%';
