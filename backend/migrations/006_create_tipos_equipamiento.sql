-- Crear tabla tipos_equipamiento
CREATE TABLE IF NOT EXISTS tipos_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255),
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar tipos desde equipamientos existentes
INSERT INTO tipos_equipamiento (nombre, descripcion, activo)
SELECT DISTINCT tipo, CONCAT('Equipos de ', tipo), 1
FROM equipamientos
WHERE tipo IS NOT NULL AND tipo != ''
ON DUPLICATE KEY UPDATE 
  tipos_equipamiento.descripcion = VALUES(descripcion);

-- Agregar columna tipo_equipamiento_id a equipamientos
ALTER TABLE equipamientos 
ADD COLUMN tipo_equipamiento_id INT NULL AFTER tipo,
ADD CONSTRAINT fk_equipamiento_tipo 
  FOREIGN KEY (tipo_equipamiento_id) 
  REFERENCES tipos_equipamiento(id);

-- Migrar datos: asignar tipo_equipamiento_id basado en tipo
UPDATE equipamientos e
JOIN tipos_equipamiento te ON e.tipo = te.nombre
SET e.tipo_equipamiento_id = te.id
WHERE e.tipo IS NOT NULL;

-- Crear índice
CREATE INDEX idx_equipamiento_tipo ON equipamientos(tipo_equipamiento_id);
