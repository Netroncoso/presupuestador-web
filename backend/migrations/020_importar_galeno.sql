-- ============================================================================
-- MIGRATION 020: Importar convenio Galeno desde CSV
-- ============================================================================

-- 1. Crear zonas de Galeno
INSERT IGNORE INTO financiador_zonas (nombre, descripcion, activo) VALUES
('GBA/SALTA/ER/MZA/SFE', 'GALENO - Provincia de Buenos Aires (La Plata y Gran La Plata, Bahía Blanca, Tandil, Mar Del Plata, Saladillo, Mar de Ajo, Rojas, San Fernando), Salta, Entre Ríos, Mendoza, Santa Fe. San Pedro (*) (pcia bs as) San Nicolas', 1),
('CORDOBA', 'GALENO - Provincia de Córdoba', 1),
('Prov. Neuquen y Rio Negro', 'GALENO - Provincias de Neuquén y Río Negro', 1),
('Prov. Chubut y Sta. Cruz', 'GALENO - Provincias de Chubut y Santa Cruz', 1);

-- 2. Obtener financiador Galeno (ya existe con id=40)
SET @financiador_galeno_id = 40;

-- Actualizar recargos de Galeno
UPDATE financiador 
SET porcentaje_horas_nocturnas = 20.00,
    porcentaje_dificil_acceso = 20.00
WHERE id = 40;

-- 3. Crear servicios
INSERT IGNORE INTO servicios (nombre, codigo_financiador, tipo_unidad, activo) VALUES
('Acompañante Terapeutico hs', '30050562', 'horas', 1),
('Consulta Especialista', '30050383', 'consultas', 1),
('Consulta Medica Adulto', '30050459', 'consultas', 1),
('Consulta medica Pediatria', '30050429', 'consultas', 1),
('Cuidador hs', '30050410', 'horas', 1),
('Enfermeria Vestida para Control/Aseo/Aplicacion ATB', '30050585', 'visitas', 1),
('Enfermeria Vestida para Tratamiento de heridas/escaras/Curaciones', '30050584', 'visitas', 1),
('Estimulacion Temprana', '30050419', 'sesiones', 1),
('Estimulacion Temprana Pediatria', '30050590', 'sesiones', 1),
('Fisioterapia, Kinesiologia y Rehabilitacion Adulto', '30050413', 'sesiones', 1),
('Fisioterapia, Kinesiologia y Rehabilitacion Pediatria', '30050587', 'sesiones', 1),
('Fonoaudiologia', '30050415', 'sesiones', 1),
('Fonoaudiologia Pediatria', '30050588', 'sesiones', 1),
('Kinesiologia Respiratoria en Internacion Domiciliaria', '30050411', 'sesiones', 1),
('Nutricionista', '30050333', 'consultas', 1),
('Psicologia', '30050335', 'sesiones', 1),
('Terapia Ocupacional', '30050417', 'sesiones', 1),
('Terapia Ocupacional Pediatria', '30050589', 'sesiones', 1),
('Visita de Enfermeria Adulto hs', '30050408', 'horas', 1),
('Visita de Enfermeria Pediatria hs', '30050409', 'horas', 1);

-- 4. Crear relaciones financiador_servicio
INSERT IGNORE INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT 
  @financiador_galeno_id,
  s.id,
  1,
  CASE WHEN s.tipo_unidad = 'horas' THEN 1 ELSE 0 END,
  CASE WHEN s.codigo_financiador IN ('30050429', '30050587', '30050409') THEN 0 ELSE 1 END
FROM servicios s
WHERE s.codigo_financiador IN (
  '30050562', '30050383', '30050459', '30050429', '30050410',
  '30050585', '30050584', '30050419', '30050590', '30050413',
  '30050587', '30050415', '30050588', '30050411', '30050333',
  '30050335', '30050417', '30050589', '30050408', '30050409'
);

-- 5. Insertar valores por zona (solo servicios activos)
-- Zona: GBA/SALTA/ER/MZA/SFE
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'GBA/SALTA/ER/MZA/SFE'),
  CASE s.codigo_financiador
    WHEN '30050562' THEN 7127.78 WHEN '30050383' THEN 36439.88 WHEN '30050459' THEN 31884.87
    WHEN '30050410' THEN 5352.10 WHEN '30050585' THEN 9109.96 WHEN '30050584' THEN 9109.96
    WHEN '30050419' THEN 17081.20 WHEN '30050590' THEN 17081.20 WHEN '30050413' THEN 15942.45
    WHEN '30050415' THEN 17081.20 WHEN '30050588' THEN 17081.20 WHEN '30050411' THEN 15942.45
    WHEN '30050333' THEN 10879.19 WHEN '30050335' THEN 20497.41 WHEN '30050417' THEN 15942.45
    WHEN '30050589' THEN 15942.45 WHEN '30050408' THEN 6263.11
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id AND fs.activo = 1
  AND s.codigo_financiador IN ('30050562','30050383','30050459','30050410','30050585','30050584','30050419','30050590','30050413','30050415','30050588','30050411','30050333','30050335','30050417','30050589','30050408');

-- Zona: CORDOBA
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'CORDOBA'),
  CASE s.codigo_financiador
    WHEN '30050562' THEN 6564.93 WHEN '30050383' THEN 34162.38 WHEN '30050459' THEN 28468.66
    WHEN '30050410' THEN 4554.98 WHEN '30050585' THEN 7971.22 WHEN '30050584' THEN 9109.96
    WHEN '30050419' THEN 17081.20 WHEN '30050590' THEN 17081.20 WHEN '30050413' THEN 17081.20
    WHEN '30050415' THEN 17081.20 WHEN '30050588' THEN 17081.20 WHEN '30050411' THEN 17081.20
    WHEN '30050333' THEN 10550.92 WHEN '30050335' THEN 18219.92 WHEN '30050417' THEN 9097.25
    WHEN '30050589' THEN 9097.25 WHEN '30050408' THEN 5693.74
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id AND fs.activo = 1
  AND s.codigo_financiador IN ('30050562','30050383','30050459','30050410','30050585','30050584','30050419','30050590','30050413','30050415','30050588','30050411','30050333','30050335','30050417','30050589','30050408');

-- Zona: Prov. Neuquen y Rio Negro
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'Prov. Neuquen y Rio Negro'),
  CASE s.codigo_financiador
    WHEN '30050459' THEN 50104.82 WHEN '30050410' THEN 6263.11 WHEN '30050585' THEN 15942.45
    WHEN '30050584' THEN 15942.45 WHEN '30050419' THEN 33156.62 WHEN '30050590' THEN 33156.62
    WHEN '30050413' THEN 23913.67 WHEN '30050415' THEN 30835.71 WHEN '30050588' THEN 30835.71
    WHEN '30050411' THEN 23913.67 WHEN '30050333' THEN 19894.03 WHEN '30050335' THEN 27851.60
    WHEN '30050417' THEN 28514.70 WHEN '30050589' THEN 28514.70 WHEN '30050408' THEN 8620.72
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id AND fs.activo = 1
  AND s.codigo_financiador IN ('30050459','30050410','30050585','30050584','30050419','30050590','30050413','30050415','30050588','30050411','30050333','30050335','30050417','30050589','30050408');

-- Zona: Prov. Chubut y Sta. Cruz
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio)
SELECT fs.id, (SELECT id FROM financiador_zonas WHERE nombre = 'Prov. Chubut y Sta. Cruz'),
  CASE s.codigo_financiador
    WHEN '30050459' THEN 59681.95 WHEN '30050410' THEN 7294.48 WHEN '30050585' THEN 10610.17
    WHEN '30050584' THEN 10610.17 WHEN '30050413' THEN 33156.62 WHEN '30050415' THEN 43103.63
    WHEN '30050588' THEN 43103.63 WHEN '30050411' THEN 33156.62 WHEN '30050408' THEN 8620.72
  END, CURDATE()
FROM financiador_servicio fs JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_galeno_id AND fs.activo = 1
  AND s.codigo_financiador IN ('30050459','30050410','30050585','30050584','30050413','30050415','30050588','30050411','30050408');

SELECT 'Importación de Galeno completada exitosamente' as resultado;
