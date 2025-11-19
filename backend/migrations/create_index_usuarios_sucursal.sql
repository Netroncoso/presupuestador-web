-- Crear índice para mejorar performance (solo si no existe)
CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal ON usuarios(sucursal_id);