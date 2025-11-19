-- FASE 1: Sistema de Versiones + Auditoría (Versión Simple)
-- Migración compatible con MySQL estándar

-- 1. AGREGAR CAMPOS A PRESUPUESTOS
ALTER TABLE presupuestos 
ADD COLUMN version INT DEFAULT 1;

ALTER TABLE presupuestos 
ADD COLUMN presupuesto_padre INT NULL;

ALTER TABLE presupuestos 
ADD COLUMN es_ultima_version TINYINT(1) DEFAULT 1;

ALTER TABLE presupuestos 
ADD COLUMN estado ENUM('borrador','pendiente','en_revision','aprobado','rechazado') DEFAULT 'borrador';

-- 2. AGREGAR FOREIGN KEY
ALTER TABLE presupuestos 
ADD CONSTRAINT fk_presupuestos_padre 
FOREIGN KEY (presupuesto_padre) REFERENCES presupuestos(idPresupuestos);

-- 3. MODIFICAR TABLA USUARIOS
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM('admin','user','auditor_medico') DEFAULT 'user';

-- 4. CREAR TABLA NOTIFICACIONES
CREATE TABLE notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    presupuesto_id INT NOT NULL,
    version_presupuesto INT DEFAULT 1,
    tipo ENUM('pendiente','aprobado','rechazado','nueva_version') DEFAULT 'pendiente',
    mensaje VARCHAR(512),
    estado ENUM('nuevo','leido') DEFAULT 'nuevo',
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE
);

-- 5. CREAR TABLA AUDITORÍAS
CREATE TABLE auditorias_presupuestos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    presupuesto_id INT NOT NULL,
    version_presupuesto INT NOT NULL,
    auditor_id INT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    comentario TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
    FOREIGN KEY (auditor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 6. CREAR ÍNDICES
CREATE INDEX idx_presupuestos_version ON presupuestos(presupuesto_padre, version);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado, es_ultima_version);
CREATE INDEX idx_presupuestos_ultima_version ON presupuestos(es_ultima_version, estado);
CREATE INDEX idx_usuario_estado ON notificaciones(usuario_id, estado, creado_en);
CREATE INDEX idx_presupuesto_version ON notificaciones(presupuesto_id, version_presupuesto);
CREATE INDEX idx_auditoria_presupuesto ON auditorias_presupuestos(presupuesto_id, version_presupuesto);
CREATE INDEX idx_auditoria_auditor ON auditorias_presupuestos(auditor_id, fecha);

-- 7. MIGRAR DATOS EXISTENTES
UPDATE presupuestos SET 
    version = 1,
    es_ultima_version = 1,
    estado = 'aprobado'
WHERE version IS NULL;

-- 8. CREAR USUARIO AUDITOR
INSERT IGNORE INTO usuarios (username, password, rol, activo) 
VALUES ('auditor', '$2b$10$ejemplo_hash_seguro', 'auditor_medico', 1);