-- ============================================================================
-- MIGRACIÓN: Sistema Multi-Gerencial v3.0
-- Fecha: Enero 2025
-- Base de datos: mh_1
-- ============================================================================

USE mh_1;

-- Desactivar safe mode temporalmente
SET SQL_SAFE_UPDATES = 0;

-- ============================================================================
-- PASO 1: ELIMINAR TRIGGERS OBSOLETOS
-- ============================================================================

DROP TRIGGER IF EXISTS notificar_auditoria_requerida;
DROP TRIGGER IF EXISTS notificar_cambio_estado;

-- ============================================================================
-- PASO 2: AGREGAR NUEVOS ESTADOS (manteniendo viejos temporalmente)
-- ============================================================================

ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente',                      -- DEPRECADO
  'en_revision',                    -- DEPRECADO
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'rechazado'
) DEFAULT 'borrador';

-- ============================================================================
-- PASO 3: MIGRAR ESTADOS EXISTENTES
-- ============================================================================

UPDATE presupuestos 
SET estado = 'pendiente_administrativa' 
WHERE estado = 'pendiente';

UPDATE presupuestos 
SET estado = 'en_revision_administrativa' 
WHERE estado = 'en_revision';

-- ============================================================================
-- PASO 4: AGREGAR NUEVOS ROLES (manteniendo viejos temporalmente)
-- ============================================================================

ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user',
  'auditor_medico',                 -- DEPRECADO
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'admin'
) DEFAULT 'user';

-- ============================================================================
-- PASO 5: MIGRAR ROLES EXISTENTES
-- ============================================================================

UPDATE usuarios 
SET rol = 'gerencia_administrativa' 
WHERE rol = 'auditor_medico';

-- ============================================================================
-- PASO 6: AGREGAR COLUMNAS DE ASIGNACIÓN
-- ============================================================================

-- Agregar revisor_id si no existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'mh_1' 
    AND TABLE_NAME = 'presupuestos' 
    AND COLUMN_NAME = 'revisor_id'
);

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE presupuestos ADD COLUMN revisor_id INT NULL AFTER estado',
  'SELECT "Columna revisor_id ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar revisor_asignado_at si no existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'mh_1' 
    AND TABLE_NAME = 'presupuestos' 
    AND COLUMN_NAME = 'revisor_asignado_at'
);

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE presupuestos ADD COLUMN revisor_asignado_at TIMESTAMP NULL AFTER revisor_id',
  'SELECT "Columna revisor_asignado_at ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar FK solo si no existe
SET @fk_exists = (
  SELECT COUNT(*) 
  FROM information_schema.TABLE_CONSTRAINTS 
  WHERE CONSTRAINT_SCHEMA = 'mh_1' 
    AND TABLE_NAME = 'presupuestos' 
    AND CONSTRAINT_NAME = 'fk_presupuestos_revisor'
);

SET @sql = IF(@fk_exists = 0, 
  'ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuestos_revisor FOREIGN KEY (revisor_id) REFERENCES usuarios(id) ON DELETE SET NULL',
  'SELECT "FK ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PASO 7: CREAR ÍNDICES PARA ALTO VOLUMEN
-- ============================================================================

-- Índice compuesto para queries de pendientes por gerencia
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_estado_revisor');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_estado_revisor ON presupuestos(estado, revisor_id)', 'SELECT "idx_estado_revisor ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice para auto-liberación (30 min)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_revisor_asignado_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_revisor_asignado_at ON presupuestos(revisor_asignado_at, estado)', 'SELECT "idx_revisor_asignado_at ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice para búsqueda por revisor
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_revisor_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_revisor_id ON presupuestos(revisor_id)', 'SELECT "idx_revisor_id ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice para auditorías por presupuesto (historial)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'auditorias_presupuestos' AND INDEX_NAME = 'idx_auditoria_presupuesto');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_auditoria_presupuesto ON auditorias_presupuestos(presupuesto_id, fecha)', 'SELECT "idx_auditoria_presupuesto ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice para auditorías por auditor
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'auditorias_presupuestos' AND INDEX_NAME = 'idx_auditoria_auditor');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_auditoria_auditor ON auditorias_presupuestos(auditor_id, fecha)', 'SELECT "idx_auditoria_auditor ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice para notificaciones por usuario (solo usuario_id)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'notificaciones' AND INDEX_NAME = 'idx_notif_usuario');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_notif_usuario ON notificaciones(usuario_id)', 'SELECT "idx_notif_usuario ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice para presupuestos por usuario y estado
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_presup_usuario_estado');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_presup_usuario_estado ON presupuestos(usuario_id, estado)', 'SELECT "idx_presup_usuario_estado ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Índice para presupuestos por sucursal y estado
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_presup_sucursal_estado');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_presup_sucursal_estado ON presupuestos(sucursal_id, estado)', 'SELECT "idx_presup_sucursal_estado ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- PASO 8: LIMPIAR ESTADOS DEPRECADOS
-- ============================================================================

ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'rechazado'
) DEFAULT 'borrador';

-- ============================================================================
-- PASO 9: LIMPIAR ROLES DEPRECADOS
-- ============================================================================

ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'admin'
) DEFAULT 'user';

-- ============================================================================
-- PASO 10: REACTIVAR SAFE MODE
-- ============================================================================

SET SQL_SAFE_UPDATES = 1;

-- ============================================================================
-- PASO 11: VERIFICACIÓN
-- ============================================================================

-- Verificar estados migrados
SELECT 
  estado, 
  COUNT(*) as cantidad 
FROM presupuestos 
GROUP BY estado 
ORDER BY cantidad DESC;

-- Verificar roles migrados
SELECT 
  rol, 
  COUNT(*) as cantidad 
FROM usuarios 
GROUP BY rol 
ORDER BY cantidad DESC;

-- Verificar índices creados
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME IN ('presupuestos', 'auditorias_presupuestos', 'notificaciones')
  AND INDEX_NAME LIKE 'idx_%'
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================

/*
✅ Triggers eliminados: 2
✅ Estados agregados: 7 nuevos + 1 condicional
✅ Estados migrados: pendiente → pendiente_administrativa, en_revision → en_revision_administrativa
✅ Roles agregados: 4 gerencias
✅ Roles migrados: auditor_medico → gerencia_administrativa
✅ Columnas agregadas: revisor_id, revisor_asignado_at
✅ Foreign Keys: 1 (revisor_id → usuarios.id)
✅ Índices creados: 9 (optimizados para alto volumen)

PRÓXIMOS PASOS:
1. Ejecutar: mysql -u root -p mh_1 < backend/migrations/001_migrate_multi_gerencial.sql
2. Verificar resultados de queries de verificación
3. Continuar con Fase 2: Backend - Tipos y Configuración
*/
