-- ============================================================================
-- Migration 021: Importar Tarifario OSPEDYC
-- ============================================================================
-- Fecha: Febrero 2025
-- Descripción: Importa servicios y valores de OSPEDYC con códigos y zonas

-- Paso 1: Usar financiador OSPEDYC existente (ID 108)
SET @financiador_id = 108;

-- Actualizar recargos de OSPEDYC
UPDATE financiador 
SET porcentaje_horas_nocturnas = 25.00, porcentaje_dificil_acceso = 25.00
WHERE id = @financiador_id;

-- Paso 2: Usar zonas existentes de financiador_zonas
SET @zona_amba_id = 36;
SET @zona_interior_id = 37;

-- Paso 3: Insertar servicios con códigos OSPEDYC (sin pisar códigos existentes)

-- Visita Médica
INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Consulta médica adulto', 'visita', '990016', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Consulta médica pediátrica', 'visita', '990017', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Consulta especialista adulto', 'visita', '990038', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Consulta especialista pediátrica', 'visita', '990039', 1);

-- Visita Enfermería
INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Enfermería adulto', 'hora', '990018', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Enfermería pediátrica', 'hora', '990019', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Aplicaciones y controles adulto', 'visita', '990047', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Aplicaciones y controles pediátrico', 'visita', '990047', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Tratamiento heridas y escaras adulto', 'visita', '990048', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Tratamiento heridas y escaras pediátrico', 'visita', '990048', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Medicación endovenosa adulto', 'visita', '990049', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Medicación endovenosa pediátrico', 'visita', '990049', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 4 hs adulto', 'guardia', '990050', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 4 hs pediátrica', 'guardia', '990051', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 8 hs adulto', 'guardia', '990052', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 8 hs pediátrica', 'guardia', '990053', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 12 hs adulto', 'guardia', '990054', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 12 hs pediátrica', 'guardia', '990055', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 24 hs adulto', 'guardia', '990056', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Guardia 24 hs pediátrica', 'guardia', '990057', 1);

-- Cuidador / Acompañante Terapeútico
INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Cuidador adulto', 'hora', '990024', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Cuidador pediátrico', 'hora', '990028', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Acompañante terapéutico adulto', 'hora', '990045', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Acompañante terapéutico pediátrico', 'hora', '990046', 1);

-- Rehabilitación
INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Fisioterapia adulto', 'sesion', '990020', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Fisioterapia pediátrico', 'sesion', '990021', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Fonoaudiología adulto', 'sesion', '990022', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Fonoaudiología pediátrico', 'sesion', '990023', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Estimulación temprana', 'sesion', '990042', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Terapia ocupacional adulto', 'sesion', '990040', 1);

INSERT IGNORE INTO servicios (nombre, tipo_unidad, codigo_financiador, activo) 
VALUES ('Terapia ocupacional pediátrico', 'sesion', '990041', 1);

-- Paso 4: Crear acuerdos financiador_servicio con unidades_base y admite_horas_nocturnas

-- Guardias tienen unidades_base según horas (4, 8, 12, 24)
INSERT IGNORE INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT @financiador_id, s.id, 4, 1, 1
FROM servicios s WHERE s.codigo_financiador IN ('990050', '990051');

INSERT IGNORE INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT @financiador_id, s.id, 8, 1, 1
FROM servicios s WHERE s.codigo_financiador IN ('990052', '990053');

INSERT IGNORE INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT @financiador_id, s.id, 12, 1, 1
FROM servicios s WHERE s.codigo_financiador IN ('990054', '990055');

INSERT IGNORE INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT @financiador_id, s.id, 24, 1, 1
FROM servicios s WHERE s.codigo_financiador IN ('990056', '990057');

-- Servicios por hora (enfermería, cuidador, AT) admiten nocturno
INSERT IGNORE INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT @financiador_id, s.id, 1, 1, 1
FROM servicios s WHERE s.codigo_financiador IN ('990018', '990019', '990024', '990028', '990045', '990046');

-- Resto de servicios (visitas, sesiones) no admiten nocturno
INSERT IGNORE INTO financiador_servicio (financiador_id, servicio_id, unidades_base, admite_horas_nocturnas, activo)
SELECT @financiador_id, s.id, 1, 0, 1
FROM servicios s 
WHERE s.codigo_financiador IN ('990016', '990017', '990038', '990039', '990047', '990048', '990049', '990020', '990021', '990022', '990023', '990042', '990040', '990041');

-- Paso 5: Insertar valores por zona y fecha (01/01/2026)

-- AMBA - Enero 2026
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 19551.84, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990016';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 19551.84, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990017';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 22158.75, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990038', '990039');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 4185.63, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990018', '990019');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 6740.93, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990047';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 10569.33, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990048';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 11234.21, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990049';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 16743.54, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990050', '990051');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 33487.08, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990052', '990053');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 50231.63, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990054', '990055');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 100461.24, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990056', '990057');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 3737.32, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990024', '990028');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 6201.54, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990045', '990046');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 11234.21, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990022', '990023', '990042');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_amba_id, 10109.88, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990040', '990041');

-- INTERIOR - Enero 2026
INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 23462.21, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990016', '990017');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 27372.58, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990038', '990039');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 5442.54, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990018', '990019');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 8762.91, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990047';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 12265.44, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990048';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 14603.16, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador = '990049';

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 21177.11, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990050', '990051');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 40920.22, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990052', '990053');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 60437.65, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990054', '990055');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 120894.53, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990056', '990057');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 4860.64, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990024', '990028');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 8062.60, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990045', '990046');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 13141.83, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990020', '990021');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 14603.16, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990022', '990023', '990042');

INSERT INTO financiador_servicio_valores (financiador_servicio_id, zona_financiador_id, precio_facturar, fecha_inicio, fecha_fin)
SELECT fs.id, @zona_interior_id, 13141.83, '2026-01-01', '2026-02-28'
FROM financiador_servicio fs
INNER JOIN servicios s ON fs.servicio_id = s.id
WHERE fs.financiador_id = @financiador_id AND s.codigo_financiador IN ('990040', '990041');

-- Nota: Los valores de Marzo 2026 se pueden agregar después con fecha_inicio = '2026-03-01'
