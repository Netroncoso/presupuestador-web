-- Agregar campo usuario_id a tabla presupuestos
ALTER TABLE presupuestos 
ADD COLUMN usuario_id INT NULL,
ADD CONSTRAINT fk_presupuestos_usuario 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id);

-- Crear índice para mejorar performance
CREATE INDEX idx_presupuestos_usuario ON presupuestos(usuario_id);