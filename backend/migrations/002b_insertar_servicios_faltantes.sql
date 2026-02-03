-- ============================================================================
-- MIGRACIÓN: INSERTAR SERVICIOS FALTANTES DEL TARIFARIO
-- ============================================================================
-- Agrega servicios que están en el CSV pero no en tarifario_servicio
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

INSERT INTO tarifario_servicio (nombre, tipo_unidad) VALUES
('VISITA ENFERMERIA', 'horas'),
('VISITA ENFERMERIA PEDIATRICA', 'horas'),
('VISITA MEDICA CLINICA', 'horas'),
('VISITA MEDICO PEDIATRA', 'horas'),
('KINESIOLOGIA', 'horas'),
('FONOAUDIOLOGIA', 'horas'),
('TERAPIA OCUPACIONAL', 'horas');

-- Verificación
SELECT id, nombre FROM tarifario_servicio ORDER BY id;
