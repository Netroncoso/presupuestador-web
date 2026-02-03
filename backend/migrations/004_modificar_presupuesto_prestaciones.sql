-- ============================================================================
-- MIGRACIÓN: MODIFICAR TABLA presupuesto_prestaciones PARA TARIFARIO
-- ============================================================================
-- Agrega columnas necesarias para el módulo de Servicios por Presupuesto
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- 1. ELIMINAR CONSTRAINT UNIQUE ANTIGUA
-- ============================================================================
-- La constraint actual impide tener el mismo servicio múltiples veces
-- Necesitamos permitir: mismo servicio de convenio Y de presupuesto

ALTER TABLE presupuesto_prestaciones
DROP INDEX unique_presupuesto_prestacion;

-- 2. AGREGAR NUEVAS COLUMNAS
-- ============================================================================

ALTER TABLE presupuesto_prestaciones
ADD COLUMN tipo_servicio ENUM('convenio', 'presupuesto') NOT NULL DEFAULT 'convenio' 
  COMMENT 'Origen: convenio con financiador o tarifario interno'
  AFTER valor_facturar;

ALTER TABLE presupuesto_prestaciones
ADD COLUMN fuera_tarifario TINYINT(1) NOT NULL DEFAULT 0 
  COMMENT 'Indica si el costo fue editado manualmente (fuera del tarifario)'
  AFTER tipo_servicio;

ALTER TABLE presupuesto_prestaciones
ADD COLUMN zona_id INT NULL 
  COMMENT 'FK → tarifario_zonas.id (solo para tipo_servicio=presupuesto)'
  AFTER fuera_tarifario;

ALTER TABLE presupuesto_prestaciones
ADD COLUMN orden_costo TINYINT NULL 
  COMMENT 'Orden del costo usado (1-5), NULL para convenio'
  AFTER zona_id;

-- 3. AGREGAR FOREIGN KEY PARA ZONA
-- ============================================================================

ALTER TABLE presupuesto_prestaciones
ADD CONSTRAINT fk_prestaciones_zona
FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id);

-- 4. AGREGAR NUEVA CONSTRAINT UNIQUE
-- ============================================================================
-- Ahora la unicidad incluye tipo_servicio para permitir:
-- - Un servicio de convenio
-- - El mismo servicio de presupuesto (con zona diferente)

ALTER TABLE presupuesto_prestaciones
ADD UNIQUE KEY unique_presupuesto_prestacion_tipo 
  (idPresupuestos, id_servicio, tipo_servicio, zona_id);

-- 5. AGREGAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

ALTER TABLE presupuesto_prestaciones
ADD INDEX idx_tipo_servicio (tipo_servicio);

ALTER TABLE presupuesto_prestaciones
ADD INDEX idx_fuera_tarifario (fuera_tarifario);

ALTER TABLE presupuesto_prestaciones
ADD INDEX idx_zona (zona_id);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SHOW CREATE TABLE presupuesto_prestaciones;

-- Verificar columnas agregadas
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'presupuesto_prestaciones'
  AND COLUMN_NAME IN ('tipo_servicio', 'fuera_tarifario', 'zona_id', 'orden_costo')
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- VALORES POR DEFECTO:
-- - tipo_servicio: 'convenio' (mantiene compatibilidad con registros existentes)
-- - fuera_tarifario: 0 (false)
-- - zona_id: NULL (solo se llena para tipo_servicio='presupuesto')
-- - orden_costo: NULL (solo se llena para tipo_servicio='presupuesto')
--
-- CONSTRAINT UNIQUE:
-- - Permite mismo id_servicio con diferentes tipo_servicio
-- - Permite mismo id_servicio + tipo_servicio='presupuesto' con diferentes zona_id
-- - Ejemplo válido:
--   * (presupuesto=1, servicio='HORA CUIDADOR', tipo='convenio', zona=NULL)
--   * (presupuesto=1, servicio='HORA CUIDADOR', tipo='presupuesto', zona=1)
--
-- REGLAS DE AUDITORÍA:
-- - orden_costo = 5 → Auditoría prestacional obligatoria
-- - fuera_tarifario = 1 → Se registra para auditoría
--
-- ============================================================================
