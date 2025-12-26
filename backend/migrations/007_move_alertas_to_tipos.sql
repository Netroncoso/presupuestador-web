-- Agregar columnas de alertas a tipos_equipamiento (solo si no existen)
DELIMITER $$

DROP PROCEDURE IF EXISTS add_alertas_tipos$$
CREATE PROCEDURE add_alertas_tipos()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'tipos_equipamiento' 
        AND COLUMN_NAME = 'genera_alerta'
    ) THEN
        ALTER TABLE tipos_equipamiento
        ADD COLUMN genera_alerta TINYINT(1) DEFAULT 0 AFTER activo,
        ADD COLUMN umbral_alerta INT DEFAULT NULL AFTER genera_alerta,
        ADD COLUMN mensaje_alerta VARCHAR(255) DEFAULT NULL AFTER umbral_alerta,
        ADD COLUMN color_alerta VARCHAR(20) DEFAULT 'orange' AFTER mensaje_alerta;
    END IF;
END$$

DELIMITER ;

CALL add_alertas_tipos();
DROP PROCEDURE IF EXISTS add_alertas_tipos;

-- Migrar alertas desde equipamientos a tipos_equipamiento
-- Tomar el primer equipamiento de cada tipo que tenga alertas configuradas
SET SQL_SAFE_UPDATES = 0;

UPDATE tipos_equipamiento te
JOIN (
  SELECT 
    tipo_equipamiento_id,
    MAX(genera_alerta) as genera_alerta,
    MAX(umbral_alerta) as umbral_alerta,
    MAX(mensaje_alerta) as mensaje_alerta,
    MAX(color_alerta) as color_alerta
  FROM equipamientos
  WHERE tipo_equipamiento_id IS NOT NULL
  GROUP BY tipo_equipamiento_id
) e ON te.id = e.tipo_equipamiento_id
SET 
  te.genera_alerta = e.genera_alerta,
  te.umbral_alerta = e.umbral_alerta,
  te.mensaje_alerta = e.mensaje_alerta,
  te.color_alerta = e.color_alerta
WHERE te.id = e.tipo_equipamiento_id;

SET SQL_SAFE_UPDATES = 1;

-- Eliminar columnas de alertas de equipamientos (ya no se usan)
ALTER TABLE equipamientos
DROP COLUMN genera_alerta,
DROP COLUMN umbral_alerta,
DROP COLUMN mensaje_alerta,
DROP COLUMN color_alerta;
