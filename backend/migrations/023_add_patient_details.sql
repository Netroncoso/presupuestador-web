-- ============================================================================
-- MIGRACIÓN 023: AGREGAR DATOS ADICIONALES DEL PACIENTE
-- ============================================================================

USE mh_1;

ALTER TABLE presupuestos
ADD COLUMN fecha_nacimiento DATE NULL AFTER DNI,
ADD COLUMN numero_afiliado VARCHAR(100) NULL AFTER fecha_nacimiento,
ADD COLUMN contacto_nombre VARCHAR(100) NULL AFTER numero_afiliado,
ADD COLUMN contacto_telefono VARCHAR(50) NULL AFTER contacto_nombre,
ADD COLUMN diagnostico_medico TEXT NULL AFTER contacto_telefono,
ADD COLUMN domicilio VARCHAR(255) NULL AFTER diagnostico_medico,
ADD COLUMN localidad VARCHAR(100) NULL AFTER domicilio;

SELECT 'Migración 023 completada: Columnas de datos del paciente agregadas' as status;
