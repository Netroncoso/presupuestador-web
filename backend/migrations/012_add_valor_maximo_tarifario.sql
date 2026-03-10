-- Migration 012: Agregar valor_maximo a tarifario_servicio_valores
-- Permite definir un límite máximo por servicio/zona para detectar markup excesivo

ALTER TABLE tarifario_servicio_valores 
ADD COLUMN valor_maximo DECIMAL(10,2) NULL COMMENT 'Valor máximo permitido para este servicio/zona';

-- Deshabilitar modo seguro temporalmente
SET SQL_SAFE_UPDATES = 0;

-- Actualizar valores existentes con un valor por defecto (costo_5 * 1.8 como ejemplo)
UPDATE tarifario_servicio_valores 
SET valor_maximo = costo_5 * 1.8 
WHERE valor_maximo IS NULL;

-- Rehabilitar modo seguro
SET SQL_SAFE_UPDATES = 1;

-- Agregar índice para mejorar performance en consultas de auditoría
CREATE INDEX idx_tarifario_valores_maximo ON tarifario_servicio_valores(servicio_id, zona_id, valor_maximo);