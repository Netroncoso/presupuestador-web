-- Agregar columna codigo_producto a insumos y equipamientos
-- Para sincronización con sistemas externos (EAN, SKU, etc)

DELIMITER $$

-- Agregar codigo_producto a insumos si no existe
DROP PROCEDURE IF EXISTS add_codigo_producto_insumos$$
CREATE PROCEDURE add_codigo_producto_insumos()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'insumos' 
        AND COLUMN_NAME = 'codigo_producto'
    ) THEN
        ALTER TABLE insumos ADD COLUMN codigo_producto VARCHAR(50) NULL COMMENT 'Código de producto para sincronización externa (EAN, SKU)';
    END IF;
END$$

-- Agregar fecha_actualizacion a insumos si no existe
DROP PROCEDURE IF EXISTS add_fecha_actualizacion_insumos$$
CREATE PROCEDURE add_fecha_actualizacion_insumos()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'insumos' 
        AND COLUMN_NAME = 'fecha_actualizacion'
    ) THEN
        ALTER TABLE insumos ADD COLUMN fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización del precio';
    END IF;
END$$

-- Agregar codigo_producto a equipamientos si no existe
DROP PROCEDURE IF EXISTS add_codigo_producto_equipamientos$$
CREATE PROCEDURE add_codigo_producto_equipamientos()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'equipamientos' 
        AND COLUMN_NAME = 'codigo_producto'
    ) THEN
        ALTER TABLE equipamientos ADD COLUMN codigo_producto VARCHAR(50) NULL COMMENT 'Código de producto para sincronización externa (EAN, SKU)';
    END IF;
END$$

DELIMITER ;

-- Ejecutar procedimientos
CALL add_codigo_producto_insumos();
CALL add_fecha_actualizacion_insumos();
CALL add_codigo_producto_equipamientos();

-- Limpiar procedimientos
DROP PROCEDURE IF EXISTS add_codigo_producto_insumos;
DROP PROCEDURE IF EXISTS add_fecha_actualizacion_insumos;
DROP PROCEDURE IF EXISTS add_codigo_producto_equipamientos;

-- Índices para búsqueda rápida por código (solo si no existen)
DELIMITER $$

DROP PROCEDURE IF EXISTS add_index_insumos_codigo$$
CREATE PROCEDURE add_index_insumos_codigo()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'insumos'
        AND INDEX_NAME = 'idx_insumos_codigo_producto'
    ) THEN
        CREATE INDEX idx_insumos_codigo_producto ON insumos(codigo_producto);
    END IF;
END$$

DROP PROCEDURE IF EXISTS add_index_equipamientos_codigo$$
CREATE PROCEDURE add_index_equipamientos_codigo()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'equipamientos'
        AND INDEX_NAME = 'idx_equipamientos_codigo_producto'
    ) THEN
        CREATE INDEX idx_equipamientos_codigo_producto ON equipamientos(codigo_producto);
    END IF;
END$$

DROP PROCEDURE IF EXISTS add_index_insumos_fecha$$
CREATE PROCEDURE add_index_insumos_fecha()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'insumos'
        AND INDEX_NAME = 'idx_insumos_fecha_actualizacion'
    ) THEN
        CREATE INDEX idx_insumos_fecha_actualizacion ON insumos(fecha_actualizacion);
    END IF;
END$$

DELIMITER ;

CALL add_index_insumos_codigo();
CALL add_index_equipamientos_codigo();
CALL add_index_insumos_fecha();

DROP PROCEDURE IF EXISTS add_index_insumos_codigo;
DROP PROCEDURE IF EXISTS add_index_equipamientos_codigo;
DROP PROCEDURE IF EXISTS add_index_insumos_fecha;
