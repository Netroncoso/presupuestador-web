-- Insertar configuraciones por defecto de alertas por tipo de servicio
INSERT INTO alertas_servicios (tipo_servicio, cantidad_maxima, mensaje_alerta, color_alerta, activo) VALUES
('enfermeria', 8, 'La cantidad de horas de enfermería excede lo recomendado. Verificar necesidad real del paciente.', 'orange', 1),
('kinesiologia', 10, 'Cantidad de sesiones de kinesiología superior a lo habitual. Considerar plan de tratamiento.', 'orange', 1),
('fonoaudiologia', 8, 'Sesiones de fonoaudiología exceden el promedio. Validar con profesional tratante.', 'orange', 1),
('terapia_ocupacional', 8, 'Cantidad de sesiones de terapia ocupacional elevada. Revisar plan terapéutico.', 'orange', 1),
('psicologia', 12, 'Sesiones de psicología superiores al estándar. Confirmar con área de salud mental.', 'orange', 1),
('nutricion', 6, 'Consultas de nutrición exceden lo habitual. Verificar seguimiento necesario.', 'orange', 1)
ON DUPLICATE KEY UPDATE 
  cantidad_maxima = VALUES(cantidad_maxima),
  mensaje_alerta = VALUES(mensaje_alerta);
