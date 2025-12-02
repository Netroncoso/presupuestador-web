-- ============================================================================
-- SCRIPT DE REORGANIZACIÓN DE BASE DE DATOS
-- Sistema Presupuestador Web
-- ============================================================================
-- IMPORTANTE: Hacer backup completo antes de ejecutar
-- Ejecutar en orden y verificar cada paso
-- ============================================================================

-- Deshabilitar verificación de FK temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- PASO 1: CORREGIR TIPOS DE DATOS EN PRESUPUESTOS
-- ============================================================================

-- Cambiar campos monetarios de INT a DECIMAL
ALTER TABLE presupuestos 
  MODIFY COLUMN total_insumos DECIMAL(10,2) DEFAULT 0,
  MODIFY COLUMN total_prestaciones DECIMAL(10,2) DEFAULT 0,
  MODIFY COLUMN costo_total DECIMAL(10,2) DEFAULT 0;

-- Cambiar DNI a VARCHAR para soportar DNI extranjeros
ALTER TABLE presupuestos 
  MODIFY COLUMN DNI VARCHAR(20) NOT NULL;

-- ============================================================================
-- PASO 2: CORREGIR TIPOS DE DATOS EN INSUMOS
-- ============================================================================

ALTER TABLE insumos 
  MODIFY COLUMN costo DECIMAL(10,2) DEFAULT 0;

-- ============================================================================
-- PASO 3: AGREGAR COLUMNA sucursal_id A PRESUPUESTOS
-- ============================================================================

-- Agregar nueva columna para FK
ALTER TABLE presupuestos 
  ADD COLUMN sucursal_id INT NULL AFTER Sucursal;

-- Migrar datos: buscar ID de sucursal por nombre
UPDATE presupuestos p
INNER JOIN sucursales_mh s ON p.Sucursal = s.Sucursales_mh
SET p.sucursal_id = s.ID;

-- Verificar que todos los registros tienen sucursal_id
-- SELECT COUNT(*) FROM presupuestos WHERE sucursal_id IS NULL;

-- Una vez verificado, hacer NOT NULL
-- ALTER TABLE presupuestos MODIFY COLUMN sucursal_id INT NOT NULL;

-- ============================================================================
-- PASO 4: AGREGAR FOREIGN KEYS FALTANTES
-- ============================================================================

-- FK: presupuestos.idobra_social → financiador.idobra_social
ALTER TABLE presupuestos 
  ADD CONSTRAINT fk_presupuestos_financiador 
  FOREIGN KEY (idobra_social) REFERENCES financiador(idobra_social)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- FK: presupuestos.sucursal_id → sucursales_mh.ID
ALTER TABLE presupuestos 
  ADD CONSTRAINT fk_presupuestos_sucursal 
  FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- ============================================================================
-- PASO 5: AGREGAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices en presupuestos
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_es_ultima_version ON presupuestos(es_ultima_version);
CREATE INDEX idx_presupuestos_created_at ON presupuestos(created_at);
CREATE INDEX idx_presupuestos_financiador ON presupuestos(idobra_social);

-- Índices en notificaciones
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX idx_notificaciones_creado_en ON notificaciones(creado_en);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);

-- Índices en auditorias
CREATE INDEX idx_auditorias_fecha ON auditorias_presupuestos(fecha);

-- ============================================================================
-- PASO 6: LIMPIAR PRIMARY KEYS COMPUESTAS INNECESARIAS
-- ============================================================================

-- Eliminar PK compuesta de insumos (mantener solo idInsumos)
ALTER TABLE insumos DROP PRIMARY KEY;
ALTER TABLE insumos ADD PRIMARY KEY (idInsumos);
ALTER TABLE insumos ADD UNIQUE KEY unique_producto (producto);

-- Eliminar PK compuesta de sucursales_mh (mantener solo ID)
ALTER TABLE sucursales_mh DROP PRIMARY KEY;
ALTER TABLE sucursales_mh ADD PRIMARY KEY (ID);
ALTER TABLE sucursales_mh ADD UNIQUE KEY unique_sucursal_nombre (Sucursales_mh);

-- ============================================================================
-- PASO 7: AGREGAR TABLA PARA VALORES HISTÓRICOS DE INSUMOS (OPCIONAL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS insumo_valores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_insumo INT NOT NULL,
  costo DECIMAL(10,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  vigente TINYINT(1) GENERATED ALWAYS AS (
    CASE WHEN fecha_fin IS NULL OR fecha_fin >= CURDATE() THEN 1 ELSE 0 END
  ) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_insumo) REFERENCES insumos(idInsumos) ON DELETE CASCADE,
  INDEX idx_vigente (vigente),
  INDEX idx_fechas (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PASO 8: VERIFICACIONES FINALES
-- ============================================================================

-- Verificar FKs
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Verificar índices
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- Verificar tipos de datos
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('presupuestos', 'insumos', 'presupuesto_insumos', 'presupuesto_prestaciones')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- Rehabilitar verificación de FK
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Ejecutar en ambiente de desarrollo primero
-- 2. Hacer backup completo antes de ejecutar en producción
-- 3. Verificar cada paso antes de continuar al siguiente
-- 4. La columna Sucursal antigua se puede eliminar después de verificar
-- 5. Considerar migrar datos históricos a insumo_valores
-- ============================================================================
