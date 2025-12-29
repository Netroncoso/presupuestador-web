-- Agregar columna tipo a presupuesto_equipamiento
USE mh_1;

ALTER TABLE presupuesto_equipamiento
ADD COLUMN tipo VARCHAR(50) NULL AFTER nombre;

-- Deshabilitar safe mode
SET SQL_SAFE_UPDATES = 0;

-- Actualizar registros existentes con el tipo desde equipamientos
UPDATE presupuesto_equipamiento pe
JOIN equipamientos e ON pe.id_equipamiento = e.id
JOIN tipos_equipamiento te ON e.tipo_equipamiento_id = te.id
SET pe.tipo = te.nombre
WHERE pe.tipo IS NULL;

-- Reactivar safe mode
SET SQL_SAFE_UPDATES = 1;
