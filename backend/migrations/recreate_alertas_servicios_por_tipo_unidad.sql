-- Eliminar tabla anterior y recrear con estructura correcta
DROP TABLE IF EXISTS alertas_servicios;

-- Tabla para configuración de alertas por TIPO DE UNIDAD (no por servicio específico)
CREATE TABLE alertas_servicios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tipo_unidad VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tipo de unidad: horas, sesiones, días, consultas, unidades',
  cantidad_maxima DECIMAL(10,2) NOT NULL COMMENT 'Cantidad máxima estándar para este tipo',
  mensaje_alerta TEXT COMMENT 'Mensaje personalizado de la alerta',
  color_alerta VARCHAR(20) DEFAULT 'orange' COMMENT 'Color de la alerta (orange, red, yellow)',
  activo TINYINT(1) DEFAULT 1 COMMENT 'Si la alerta está activa',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar configuraciones por defecto basadas en tipos de unidad
INSERT INTO alertas_servicios (tipo_unidad, cantidad_maxima, mensaje_alerta, color_alerta, activo) VALUES
('horas', 8, 'La cantidad de horas excede lo recomendado. Paciente puede requerir cuidados intensivos o evaluación de riesgo.', 'orange', 1),
('sesiones', 10, 'Cantidad de sesiones superior al estándar. Verificar plan de tratamiento y necesidad real.', 'orange', 1),
('consultas', 6, 'Número de consultas elevado. Validar seguimiento y frecuencia con profesional tratante.', 'orange', 1),
('días', 15, 'Cantidad de días excede lo habitual. Revisar evolución del paciente y necesidad de internación prolongada.', 'orange', 1),
('unidades', 20, 'Cantidad de unidades superior al promedio. Verificar dosificación y necesidad del tratamiento.', 'yellow', 1)
ON DUPLICATE KEY UPDATE 
  cantidad_maxima = VALUES(cantidad_maxima),
  mensaje_alerta = VALUES(mensaje_alerta);
