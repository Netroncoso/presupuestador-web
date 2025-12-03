-- Agregar regla de utilidad mínima
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad) 
VALUES ('auditoria.utilidadMinima', 50000, 'Utilidad mínima en pesos para enviar a auditoría', 'auditoria', '$')
ON DUPLICATE KEY UPDATE descripcion = 'Utilidad mínima en pesos para enviar a auditoría';
