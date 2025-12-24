-- ============================================================================
-- SCRIPT DE RECUPERACIÓN: Migraciones posteriores al 10/12/2025
-- Ejecutar en MySQL Workbench sobre base mh_1 local
-- ============================================================================

USE mh_1;
SET SQL_SAFE_UPDATES = 0;

-- ============================================================================
-- 1. MIGRACIÓN MULTI-GERENCIAL (12/12/2025) - LA MÁS IMPORTANTE
-- ============================================================================

-- Agregar nuevos estados
ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente',
  'en_revision',
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

-- Migrar estados existentes
UPDATE presupuestos SET estado = 'pendiente_administrativa' WHERE estado = 'pendiente';
UPDATE presupuestos SET estado = 'en_revision_administrativa' WHERE estado = 'en_revision';

-- Agregar nuevos roles
ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user',
  'auditor_medico',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'admin'
) DEFAULT 'user';

-- Migrar roles existentes
UPDATE usuarios SET rol = 'gerencia_administrativa' WHERE rol = 'auditor_medico';

-- Agregar columnas de asignación (verificar si existen primero)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND COLUMN_NAME = 'revisor_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE presupuestos ADD COLUMN revisor_id INT NULL AFTER estado', 'SELECT "revisor_id ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND COLUMN_NAME = 'revisor_asignado_at');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE presupuestos ADD COLUMN revisor_asignado_at TIMESTAMP NULL AFTER revisor_id', 'SELECT "revisor_asignado_at ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Agregar FK (verificar si existe primero)
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND CONSTRAINT_NAME = 'fk_presupuestos_revisor');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuestos_revisor FOREIGN KEY (revisor_id) REFERENCES usuarios(id) ON DELETE SET NULL', 'SELECT "FK ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Crear índices (verificar si existen primero)
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_estado_revisor');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_estado_revisor ON presupuestos(estado, revisor_id)', 'SELECT "idx_estado_revisor ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_revisor_asignado_at');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_revisor_asignado_at ON presupuestos(revisor_asignado_at, estado)', 'SELECT "idx_revisor_asignado_at ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_revisor_id');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_revisor_id ON presupuestos(revisor_id)', 'SELECT "idx_revisor_id ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'auditorias_presupuestos' AND INDEX_NAME = 'idx_auditoria_presupuesto');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_auditoria_presupuesto ON auditorias_presupuestos(presupuesto_id, fecha)', 'SELECT "idx_auditoria_presupuesto ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'auditorias_presupuestos' AND INDEX_NAME = 'idx_auditoria_auditor');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_auditoria_auditor ON auditorias_presupuestos(auditor_id, fecha)', 'SELECT "idx_auditoria_auditor ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'notificaciones' AND INDEX_NAME = 'idx_notif_usuario');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_notif_usuario ON notificaciones(usuario_id)', 'SELECT "idx_notif_usuario ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_presup_usuario_estado');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_presup_usuario_estado ON presupuestos(usuario_id, estado)', 'SELECT "idx_presup_usuario_estado ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_presup_sucursal_estado');
SET @sql = IF(@idx_exists = 0, 'CREATE INDEX idx_presup_sucursal_estado ON presupuestos(sucursal_id, estado)', 'SELECT "idx_presup_sucursal_estado ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Limpiar estados deprecados
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

-- Limpiar roles deprecados
ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'admin'
) DEFAULT 'user';

-- ============================================================================
-- 2. OTRAS MIGRACIONES DEL 11/12/2025
-- ============================================================================

-- Tipos de unidad (si no existe)
CREATE TABLE IF NOT EXISTS tipos_unidad (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configuración del sistema (si no existe)
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  tipo ENUM('number', 'string', 'boolean', 'json') DEFAULT 'string',
  descripcion TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Agregar sucursal_id a valores históricos (verificar si existe)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'prestador_servicio_valores' AND COLUMN_NAME = 'sucursal_id');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE prestador_servicio_valores ADD COLUMN sucursal_id INT NULL AFTER id_prestador_servicio', 'SELECT "sucursal_id ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = 'mh_1' AND TABLE_NAME = 'prestador_servicio_valores' AND CONSTRAINT_NAME = 'fk_valores_sucursal');
SET @sql = IF(@fk_exists = 0, 'ALTER TABLE prestador_servicio_valores ADD CONSTRAINT fk_valores_sucursal FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID) ON DELETE CASCADE', 'SELECT "FK fk_valores_sucursal ya existe"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET SQL_SAFE_UPDATES = 1;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT '=== ROLES ACTUALES ===' AS info;
SELECT rol, COUNT(*) as cantidad FROM usuarios GROUP BY rol;

SELECT '=== ESTADOS ACTUALES ===' AS info;
SELECT estado, COUNT(*) as cantidad FROM presupuestos GROUP BY estado;

SELECT '=== COLUMNAS PRESUPUESTOS ===' AS info;
SHOW COLUMNS FROM presupuestos LIKE '%revisor%';

SELECT '✅ MIGRACIÓN COMPLETADA' AS resultado;
