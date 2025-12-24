-- ============================================================================
-- SEED: Datos Iniciales de Equipamientos
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- ============================================================================
-- EQUIPAMIENTOS INICIALES
-- ============================================================================

INSERT INTO equipamientos (nombre, tipo, precio_referencia, genera_alerta, umbral_alerta, mensaje_alerta, descripcion) VALUES
-- Oxigenoterapia
('Tubo de Oxígeno 10m³', 'oxigenoterapia', 5000.00, TRUE, 5, 'Alto consumo de oxígeno - Paciente complejo', 'Tubo de oxígeno medicinal de 10 metros cúbicos'),
('Tubo de Oxígeno 6m³', 'oxigenoterapia', 3500.00, TRUE, 8, 'Alto consumo de oxígeno - Paciente complejo', 'Tubo de oxígeno medicinal de 6 metros cúbicos'),
('Concentrador de Oxígeno 5L', 'oxigenoterapia', 12000.00, TRUE, 2, 'Múltiples concentradores - Verificar necesidad', 'Concentrador de oxígeno de 5 litros por minuto'),
('Concentrador de Oxígeno 10L', 'oxigenoterapia', 18000.00, TRUE, 1, 'Concentrador de alto flujo - Paciente crítico', 'Concentrador de oxígeno de 10 litros por minuto'),
('Humidificador para Oxígeno', 'oxigenoterapia', 1500.00, FALSE, NULL, NULL, 'Humidificador para terapia de oxígeno'),

-- Mobiliario
('Cama Articulada Eléctrica', 'mobiliario', 15000.00, FALSE, NULL, NULL, 'Cama hospitalaria eléctrica con 3 posiciones'),
('Cama Ortopédica Manual', 'mobiliario', 8000.00, FALSE, NULL, NULL, 'Cama ortopédica manual con barandas'),
('Colchón Antiescaras', 'mobiliario', 6000.00, FALSE, NULL, NULL, 'Colchón antiescaras con compresor'),
('Silla de Ruedas Estándar', 'mobiliario', 4000.00, FALSE, NULL, NULL, 'Silla de ruedas plegable estándar'),
('Andador con Ruedas', 'mobiliario', 2500.00, FALSE, NULL, NULL, 'Andador con ruedas y frenos'),

-- Monitoreo
('Monitor de Signos Vitales', 'monitoreo', 8000.00, FALSE, NULL, NULL, 'Monitor multiparamétrico de signos vitales'),
('Oxímetro de Pulso', 'monitoreo', 2000.00, FALSE, NULL, NULL, 'Oxímetro de pulso digital'),
('Tensiómetro Digital', 'monitoreo', 1500.00, FALSE, NULL, NULL, 'Tensiómetro digital automático'),

-- Ventilación
('Nebulizador Ultrasónico', 'ventilacion', 3500.00, FALSE, NULL, NULL, 'Nebulizador ultrasónico para terapia respiratoria'),
('Aspirador de Secreciones', 'ventilacion', 5000.00, FALSE, NULL, NULL, 'Aspirador de secreciones portátil'),

-- Otros
('Bomba de Infusión', 'otro', 10000.00, FALSE, NULL, NULL, 'Bomba de infusión volumétrica'),
('Termómetro Digital', 'otro', 800.00, FALSE, NULL, NULL, 'Termómetro digital infrarrojo'),
('Glucómetro', 'otro', 1200.00, FALSE, NULL, NULL, 'Glucómetro con tiras reactivas');

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Equipamientos insertados correctamente' AS resultado;

SELECT 
  tipo,
  COUNT(*) as cantidad,
  SUM(CASE WHEN genera_alerta = TRUE THEN 1 ELSE 0 END) as con_alertas
FROM equipamientos
GROUP BY tipo
ORDER BY tipo;

SELECT * FROM equipamientos ORDER BY tipo, nombre;
