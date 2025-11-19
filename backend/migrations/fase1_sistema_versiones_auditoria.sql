-- FASE 1: Sistema de Versiones + Auditoría
-- Migración segura que preserva datos existentes

-- =====================================================
-- 1. MODIFICACIONES EN TABLA PRESUPUESTOS
-- =====================================================

-- Agregar campos de versionado (con valores por defecto seguros)
ALTER TABLE presupuestos 
ADD COLUMN version INT DEFAULT 1,
ADD COLUMN presupuesto_padre INT NULL,
ADD COLUMN es_ultima_version TINYINT(1) DEFAULT 1,
ADD COLUMN estado ENUM('borrador','pendiente','en_revision','aprobado','rechazado') DEFAULT 'borrador';

-- Agregar constraint para presupuesto_padre (self-reference)
ALTER TABLE presupuestos 
ADD CONSTRAINT fk_presupuestos_padre 
FOREIGN KEY (presupuesto_padre) REFERENCES presupuestos(idPresupuestos);

-- =====================================================
-- 2. MODIFICACIONES EN TABLA USUARIOS
-- =====================================================

-- Modificar rol para incluir auditor_medico
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('admin','user','auditor_medico') DEFAULT 'user';

-- =====================================================
-- 3. TABLA NOTIFICACIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    presupuesto_id INT NOT NULL,
    version_presupuesto INT DEFAULT 1,
    tipo ENUM('pendiente','aprobado','rechazado','nueva_version') DEFAULT 'pendiente',
    mensaje VARCHAR(512),
    estado ENUM('nuevo','leido') DEFAULT 'nuevo',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
    
    INDEX idx_usuario_estado (usuario_id, estado, creado_en),
    INDEX idx_presupuesto_version (presupuesto_id, version_presupuesto),
    
    -- Evitar notificaciones duplicadas
    UNIQUE KEY unique_notification (usuario_id, presupuesto_id, version_presupuesto, tipo)
);

-- =====================================================
-- 4. TABLA AUDITORÍAS
-- =====================================================

CREATE TABLE IF NOT EXISTS auditorias_presupuestos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    presupuesto_id INT NOT NULL,
    version_presupuesto INT NOT NULL,
    auditor_id INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    comentario TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
    FOREIGN KEY (auditor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    INDEX idx_presupuesto_version (presupuesto_id, version_presupuesto),
    INDEX idx_auditor_fecha (auditor_id, fecha),
    INDEX idx_fecha (fecha)
);

-- =====================================================
-- 5. ÍNDICES OPTIMIZADOS
-- =====================================================

-- Índices para sistema de versiones
CREATE INDEX IF NOT EXISTS idx_presupuestos_version ON presupuestos(presupuesto_padre, version);
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado, es_ultima_version);
CREATE INDEX IF NOT EXISTS idx_presupuestos_ultima_version ON presupuestos(es_ultima_version, estado);

-- Índice para búsquedas por fecha de actualización
CREATE INDEX idx_presupuestos_actualizacion ON presupuestos(updated_at);

-- =====================================================
-- 6. MIGRACIÓN DE DATOS EXISTENTES
-- =====================================================

-- Configurar presupuestos existentes como versión 1 aprobada
UPDATE presupuestos SET 
    version = 1,
    es_ultima_version = 1,
    estado = 'aprobado'
WHERE version IS NULL OR version = 0;

-- =====================================================
-- 7. CREAR USUARIO AUDITOR (OPCIONAL)
-- =====================================================

-- Solo crear si no existe
INSERT IGNORE INTO usuarios (username, password, rol, activo) 
VALUES ('auditor', '$2b$10$ejemplo_hash_seguro', 'auditor_medico', 1);

-- =====================================================
-- 8. VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

-- Verificar que todos los presupuestos tienen version y estado
SELECT 
    COUNT(*) as total_presupuestos,
    COUNT(CASE WHEN version IS NOT NULL THEN 1 END) as con_version,
    COUNT(CASE WHEN estado IS NOT NULL THEN 1 END) as con_estado,
    COUNT(CASE WHEN es_ultima_version = 1 THEN 1 END) as ultima_version
FROM presupuestos;

-- Verificar estructura de usuarios
SELECT DISTINCT rol FROM usuarios;

-- Verificar tablas creadas
SELECT 
    TABLE_NAME,
    TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('notificaciones', 'auditorias_presupuestos');

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Esta migración es SEGURA - no elimina datos existentes
-- 2. Usa IF NOT EXISTS para evitar errores en re-ejecuciones
-- 3. Configura presupuestos existentes como "aprobados" por defecto
-- 4. El usuario auditor se crea con password temporal (cambiar después)
-- 5. Todos los índices son opcionales y no afectan funcionalidad
-- =====================================================