-- Agregar campo sucursal_id a tabla usuarios
ALTER TABLE usuarios 
ADD COLUMN sucursal_id INT NULL,
ADD CONSTRAINT fk_usuarios_sucursal 
FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID);

-- Crear índice para mejorar performance (ignorar error si ya existe)
CREATE INDEX idx_usuarios_sucursal ON usuarios(sucursal_id);