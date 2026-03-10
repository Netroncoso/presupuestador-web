-- ============================================================================
-- MIGRATION 020b: Remover constraint UNIQUE de nombre en servicios
-- ============================================================================

-- Remover constraint UNIQUE de la columna nombre
ALTER TABLE servicios DROP INDEX nombre;

-- Ahora insertar los 4 servicios faltantes de Galeno
INSERT INTO servicios (nombre, codigo_financiador, tipo_unidad, activo) VALUES
('Consulta Medica Adulto', '30050459', 'consultas', 1),
('Estimulacion Temprana', '30050419', 'sesiones', 1),
('Fonoaudiologia', '30050415', 'sesiones', 1),
('Terapia Ocupacional', '30050417', 'sesiones', 1);

-- Crear relaciones financiador_servicio
SET @financiador_galeno_id = 40;

INSERT INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT 
  @financiador_galeno_id,
  s.id,
  1,
  0,
  1
FROM servicios s
WHERE s.codigo_financiador IN ('30050459', '30050419', '30050415', '30050417');

-- Insertar valores por zona
-- Zona: GBA/SALTA/ER/MZA/SFE
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'GBA/SALTA/ER/MZA/SFE'),
  CASE s.codigo_financiador
    WHEN '30050459' THEN 31884.87
    WHEN '30050419' THEN 17081.20
    WHEN '30050415' THEN 17081.20
    WHEN '30050417' THEN 15942.45
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id
  AND s.codigo_financiador IN ('30050459', '30050419', '30050415', '30050417');

-- Zona: CORDOBA
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'CORDOBA'),
  CASE s.codigo_financiador
    WHEN '30050459' THEN 28468.66
    WHEN '30050419' THEN 17081.20
    WHEN '30050415' THEN 17081.20
    WHEN '30050417' THEN 9097.25
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id
  AND s.codigo_financiador IN ('30050459', '30050419', '30050415', '30050417');

-- Zona: Prov. Neuquen y Rio Negro
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'Prov. Neuquen y Rio Negro'),
  CASE s.codigo_financiador
    WHEN '30050459' THEN 50104.82
    WHEN '30050419' THEN 33156.62
    WHEN '30050415' THEN 30835.71
    WHEN '30050417' THEN 28514.70
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id
  AND s.codigo_financiador IN ('30050459', '30050419', '30050415', '30050417');

-- Zona: Prov. Chubut y Sta. Cruz
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'Prov. Chubut y Sta. Cruz'),
  CASE s.codigo_financiador
    WHEN '30050459' THEN 59681.95
    WHEN '30050415' THEN 43103.63
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id
  AND s.codigo_financiador IN ('30050459', '30050415');

SELECT 'Servicios faltantes de Galeno agregados exitosamente' as resultado;
