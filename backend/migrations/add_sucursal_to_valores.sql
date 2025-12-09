-- Migración: Agregar sucursal_id a prestador_servicio_valores
-- Fecha: 2025-01-XX
-- Descripción: Permite valores específicos por sucursal

-- Agregar columna sucursal_id
ALTER TABLE prestador_servicio_valores 
ADD COLUMN sucursal_id INT NULL AFTER id_prestador_servicio;

-- Agregar foreign key
ALTER TABLE prestador_servicio_valores 
ADD CONSTRAINT fk_valores_sucursal 
FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID) ON DELETE CASCADE;

-- Agregar índice para optimizar consultas
CREATE INDEX idx_sucursal_fecha ON prestador_servicio_valores(sucursal_id, fecha_inicio, fecha_fin);

-- Comentarios
-- sucursal_id = NULL: Valor aplica a todas las sucursales (general)
-- sucursal_id = X: Valor aplica solo a sucursal específica
-- Prioridad: Valor específico > Valor general
