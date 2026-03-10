Use mh_1;
-- Migration 022: Mover codigo_financiador a financiador_servicio
-- Fecha: Febrero 2025
-- Descripción: Mueve el código del financiador desde servicios a la relación financiador_servicio
--              Consolida servicios duplicados manteniendo los del tarifario (sin código)

-- 1. La columna codigo_financiador ya existe en financiador_servicio (migración 020)
-- Verificar si hay códigos sin migrar

-- 2. Migrar códigos existentes desde servicios (solo los que no se migraron)
UPDATE financiador_servicio fs 
  JOIN servicios s ON fs.servicio_id = s.id 
  SET fs.codigo_financiador = s.codigo_financiador
  WHERE s.codigo_financiador IS NOT NULL
    AND fs.id > 0;

-- 3. Consolidar duplicados: Servicios CON código → Servicios SIN código (tarifario)
-- Actualizar financiador_servicio
UPDATE financiador_servicio fs
  JOIN servicios s_con_codigo ON fs.servicio_id = s_con_codigo.id
  JOIN servicios s_sin_codigo ON s_con_codigo.nombre = s_sin_codigo.nombre 
    AND s_sin_codigo.codigo_financiador IS NULL
  SET fs.servicio_id = s_sin_codigo.id
  WHERE s_con_codigo.codigo_financiador IS NOT NULL
    AND fs.id > 0;

-- Actualizar presupuesto_prestaciones
UPDATE presupuesto_prestaciones pp
  JOIN servicios s_con_codigo ON pp.servicio_id = s_con_codigo.id
  JOIN servicios s_sin_codigo ON s_con_codigo.nombre = s_sin_codigo.nombre 
    AND s_sin_codigo.codigo_financiador IS NULL
  SET pp.servicio_id = s_sin_codigo.id
  WHERE s_con_codigo.codigo_financiador IS NOT NULL
    AND pp.id > 0;

-- Actualizar tarifario_servicio_valores
UPDATE tarifario_servicio_valores tsv
  JOIN servicios s_con_codigo ON tsv.servicio_id = s_con_codigo.id
  JOIN servicios s_sin_codigo ON s_con_codigo.nombre = s_sin_codigo.nombre 
    AND s_sin_codigo.codigo_financiador IS NULL
  SET tsv.servicio_id = s_sin_codigo.id
  WHERE s_con_codigo.codigo_financiador IS NOT NULL
    AND tsv.id > 0;

-- 4. Eliminar servicios duplicados (los que tienen código)
-- Primero consolidar TODOS los duplicados por nombre (mantener ID más bajo)

-- 4a. Limpiar tabla temporal si existe
DROP TEMPORARY TABLE IF EXISTS temp_duplicados;

-- Crear tabla temporal con IDs a eliminar
CREATE TEMPORARY TABLE temp_duplicados AS
SELECT fs.id, dup.id_mantener, fs.financiador_id
FROM financiador_servicio fs
  JOIN servicios s ON fs.servicio_id = s.id
  JOIN (
    SELECT nombre, MIN(id) as id_mantener
    FROM servicios
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ) dup ON s.nombre = dup.nombre AND s.id != dup.id_mantener
  WHERE EXISTS (
    SELECT 1 FROM financiador_servicio fs2
    WHERE fs2.financiador_id = fs.financiador_id
      AND fs2.servicio_id = dup.id_mantener
  );

-- 4b. Migrar valores históricos a la relación que se mantiene
UPDATE financiador_servicio_valores fsv
  JOIN temp_duplicados td ON fsv.financiador_servicio_id = td.id
  JOIN financiador_servicio fs_mantener 
    ON fs_mantener.financiador_id = td.financiador_id 
    AND fs_mantener.servicio_id = td.id_mantener
  SET fsv.financiador_servicio_id = fs_mantener.id
  WHERE fsv.id > 0;

-- 4c. Eliminar relaciones duplicadas
DELETE FROM financiador_servicio WHERE id IN (SELECT id FROM temp_duplicados);

DROP TEMPORARY TABLE temp_duplicados;

-- 4c. Actualizar referencias restantes
UPDATE financiador_servicio fs
  JOIN servicios s ON fs.servicio_id = s.id
  JOIN (
    SELECT nombre, MIN(id) as id_mantener
    FROM servicios
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ) dup ON s.nombre = dup.nombre AND s.id != dup.id_mantener
  SET fs.servicio_id = dup.id_mantener
  WHERE fs.id > 0;

UPDATE presupuesto_prestaciones pp
  JOIN servicios s ON pp.servicio_id = s.id
  JOIN (
    SELECT nombre, MIN(id) as id_mantener
    FROM servicios
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ) dup ON s.nombre = dup.nombre AND s.id != dup.id_mantener
  SET pp.servicio_id = dup.id_mantener
  WHERE pp.id > 0;

UPDATE tarifario_servicio_valores tsv
  JOIN servicios s ON tsv.servicio_id = s.id
  JOIN (
    SELECT nombre, MIN(id) as id_mantener
    FROM servicios
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ) dup ON s.nombre = dup.nombre AND s.id != dup.id_mantener
  SET tsv.servicio_id = dup.id_mantener
  WHERE tsv.id > 0;

-- Eliminar todos los duplicados (mantener solo el de menor ID)
DELETE s FROM servicios s
  JOIN (
    SELECT nombre, MIN(id) as id_mantener
    FROM servicios
    GROUP BY nombre
    HAVING COUNT(*) > 1
  ) dup ON s.nombre = dup.nombre AND s.id != dup.id_mantener;

-- 5. Eliminar columna codigo_financiador de servicios
ALTER TABLE servicios DROP COLUMN codigo_financiador;

-- 6. Restaurar constraint UNIQUE en servicios.nombre
ALTER TABLE servicios ADD UNIQUE KEY nombre (nombre);

-- 7. Agregar índice para búsquedas por código
CREATE INDEX idx_codigo_financiador ON financiador_servicio(codigo_financiador);
