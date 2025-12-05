-- Simplificación de alertas de rentabilidad
-- De 6 parámetros a 4 parámetros más claros

-- Primero, insertar los 4 parámetros nuevos (si no existen)
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad) VALUES
('alerta.rentabilidad.desaprobado', 20, 'Rentabilidad menor a este % → Alerta Desaprobado (Rojo)', 'alertas', '%'),
('alerta.rentabilidad.mejorar', 30, 'Rentabilidad menor a este % → Alerta Mejorar (Naranja)', 'alertas', '%'),
('alerta.rentabilidad.felicitaciones', 50, 'Rentabilidad menor a este % → Alerta Felicitaciones (Verde)', 'alertas', '%'),
('alerta.rentabilidad.excepcional', 50, 'Rentabilidad mayor o igual a este % → Alerta Excepcional (Violeta)', 'alertas', '%')
ON DUPLICATE KEY UPDATE 
  valor = VALUES(valor),
  descripcion = VALUES(descripcion);

-- Verificar resultado
SELECT * FROM configuracion_sistema WHERE categoria = 'alertas' AND clave LIKE '%rentabilidad%' ORDER BY valor;
