-- =====================================================
-- Migración: Sistema de Tipos de Unidad Normalizado
-- Fecha: Diciembre 2024
-- Descripción: Tabla maestra tipos_unidad con FKs
-- =====================================================

-- 1. Crear tabla maestra de tipos de unidad
CREATE TABLE IF NOT EXISTS tipos_unidad (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre del tipo: horas, sesiones, días, consultas, unidades',
  descripcion VARCHAR(255) COMMENT 'Descripción del tipo de unidad',
  activo TINYINT(1) DEFAULT 1 COMMENT 'Si el tipo está activo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insertar tipos de unidad por defecto
INSERT INTO tipos_unidad (nombre, descripcion) VALUES
('horas', 'Unidad de tiempo en horas'),
('sesiones', 'Sesiones de tratamiento o terapia'),
('consultas', 'Consultas médicas o evaluaciones'),
('días', 'Días de internación o tratamiento'),
('unidades', 'Unidades genéricas de medida')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

-- 3. Verificar si servicios.tipo_unidad ya es VARCHAR
SET @col_type = (SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'servicios' AND COLUMN_NAME = 'tipo_unidad');

-- 4. Convertir ENUM a VARCHAR si es necesario (solo si es ENUM)
SET @sql = IF(@col_type = 'enum', 
  'ALTER TABLE servicios MODIFY COLUMN tipo_unidad VARCHAR(50) DEFAULT NULL',
  'SELECT "servicios.tipo_unidad ya es VARCHAR" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. Agregar FK servicios.tipo_unidad → tipos_unidad.nombre (si no existe)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'servicios' 
  AND CONSTRAINT_NAME = 'fk_servicios_tipo_unidad');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE servicios ADD CONSTRAINT fk_servicios_tipo_unidad FOREIGN KEY (tipo_unidad) REFERENCES tipos_unidad(nombre) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT "FK fk_servicios_tipo_unidad ya existe" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Agregar FK alertas_servicios.tipo_unidad → tipos_unidad.nombre (si no existe)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'alertas_servicios' 
  AND CONSTRAINT_NAME = 'fk_alertas_tipo_unidad');

SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE alertas_servicios ADD CONSTRAINT fk_alertas_tipo_unidad FOREIGN KEY (tipo_unidad) REFERENCES tipos_unidad(nombre) ON UPDATE CASCADE ON DELETE RESTRICT',
  'SELECT "FK fk_alertas_tipo_unidad ya existe" AS status');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Verificar estructura final
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME = 'tipos_unidad'
ORDER BY TABLE_NAME;

-- 8. Mostrar tipos de unidad activos
SELECT * FROM tipos_unidad WHERE activo = 1 ORDER BY nombre;
