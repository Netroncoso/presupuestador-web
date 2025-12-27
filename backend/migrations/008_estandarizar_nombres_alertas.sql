-- Renombrar columnas en tipos_equipamiento para que coincidan con alertas_servicios
USE mh_1;

ALTER TABLE tipos_equipamiento
CHANGE COLUMN umbral_alerta cantidad_maxima INT DEFAULT NULL,
CHANGE COLUMN genera_alerta activo_alerta TINYINT(1) DEFAULT 0;

-- Nota: mensaje_alerta y color_alerta ya tienen los mismos nombres
