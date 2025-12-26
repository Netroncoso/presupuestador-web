-- Agregar columna codigo_producto a insumos y equipamientos
-- Para sincronización con sistemas externos (EAN, SKU, etc)

ALTER TABLE insumos 
ADD COLUMN codigo_producto VARCHAR(50) NULL COMMENT 'Código de producto para sincronización externa (EAN, SKU)',
ADD COLUMN fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización del precio';

ALTER TABLE equipamientos 
ADD COLUMN codigo_producto VARCHAR(50) NULL COMMENT 'Código de producto para sincronización externa (EAN, SKU)';

-- Índices para búsqueda rápida por código
CREATE INDEX idx_insumos_codigo_producto ON insumos(codigo_producto);
CREATE INDEX idx_equipamientos_codigo_producto ON equipamientos(codigo_producto);
CREATE INDEX idx_insumos_fecha_actualizacion ON insumos(fecha_actualizacion);
