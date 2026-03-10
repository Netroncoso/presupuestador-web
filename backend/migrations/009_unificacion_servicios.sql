-- ============================================
-- MIGRACIÓN: UNIFICACIÓN DE SERVICIOS
-- Fecha: Enero 2025
-- Descripción: Unifica tablas servicios y tarifario_servicio
--              Migra convenios de sucursal a zona
-- ============================================

-- IMPORTANTE: Hacer backup antes de ejecutar
-- mysqldump -u root -p mh_1 > backup_pre_unificacion_$(date +%Y%m%d_%H%M%S).sql

USE mh_1;

START TRANSACTION;

-- ============================================
-- PASO 1: CREAR TABLAS NUEVAS
-- ============================================

-- Tabla unificada de servicios
CREATE TABLE servicios_unificados (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  descripcion TEXT,
  tipo_unidad VARCHAR(50),
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nombre (nombre),
  INDEX idx_activo (activo),
  INDEX idx_tipo_unidad (tipo_unidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Valores del tarifario MediHome (5 costos por zona)
CREATE TABLE servicios_valores_tarifario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  servicio_id INT NOT NULL,
  zona_id INT NOT NULL,
  costo_1 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 1 (más bajo)',
  costo_2 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 2',
  costo_3 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 3',
  costo_4 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 4',
  costo_5 DECIMAL(10,2) NOT NULL COMMENT 'Costo orden 5 (más alto)',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (servicio_id) REFERENCES servicios_unificados(id),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  INDEX idx_vigencia (servicio_id, zona_id, fecha_inicio, fecha_fin),
  INDEX idx_servicio_zona (servicio_id, zona_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Acuerdos con financiadores (nueva estructura)
CREATE TABLE financiador_servicio_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  financiador_id INT NOT NULL,
  servicio_id INT NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (financiador_id) REFERENCES financiador(id),
  FOREIGN KEY (servicio_id) REFERENCES servicios_unificados(id),
  UNIQUE KEY unique_financiador_servicio (financiador_id, servicio_id),
  INDEX idx_financiador (financiador_id),
  INDEX idx_servicio (servicio_id),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Valores históricos de convenios (1 precio por zona)
CREATE TABLE financiador_servicio_valores_new (
  id INT PRIMARY KEY AUTO_INCREMENT,
  financiador_servicio_id INT NOT NULL,
  zona_id INT NOT NULL,
  precio_facturar DECIMAL(10,2) NOT NULL COMMENT 'Precio convenido único por zona',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (financiador_servicio_id) REFERENCES financiador_servicio_new(id),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  INDEX idx_vigencia (financiador_servicio_id, zona_id, fecha_inicio, fecha_fin),
  INDEX idx_zona (zona_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================
-- PASO 2: MIGRAR DATOS
-- ============================================

-- 2.1: Migrar servicios desde tarifario_servicio
INSERT INTO servicios_unificados (nombre, descripcion, tipo_unidad, activo, created_at, updated_at)
SELECT nombre, descripcion, tipo_unidad, activo, created_at, updated_at
FROM tarifario_servicio;

-- 2.2: Migrar valores del tarifario MediHome
INSERT INTO servicios_valores_tarifario (
  servicio_id, 
  zona_id, 
  costo_1, 
  costo_2, 
  costo_3, 
  costo_4, 
  costo_5, 
  fecha_inicio, 
  fecha_fin,
  created_at
)
SELECT 
  su.id, 
  tsv.zona_id, 
  tsv.costo_1, 
  tsv.costo_2, 
  tsv.costo_3, 
  tsv.costo_4, 
  tsv.costo_5, 
  tsv.fecha_inicio, 
  tsv.fecha_fin,
  tsv.created_at
FROM tarifario_servicio_valores tsv
JOIN tarifario_servicio ts ON tsv.tarifario_servicio_id = ts.id
JOIN servicios_unificados su ON su.nombre = ts.nombre COLLATE utf8mb4_0900_ai_ci;

-- 2.3: Migrar acuerdos financiador_servicio
INSERT INTO financiador_servicio_new (financiador_id, servicio_id, activo, created_at, updated_at)
SELECT 
  fs.financiador_id,
  su.id,
  fs.activo,
  NOW(),
  NOW()
FROM financiador_servicio fs
JOIN servicios s ON fs.id_servicio = s.id_servicio
JOIN servicios_unificados su ON su.nombre = s.nombre COLLATE utf8mb4_0900_ai_ci
WHERE EXISTS (SELECT 1 FROM servicios_unificados su2 WHERE su2.nombre = s.nombre COLLATE utf8mb4_0900_ai_ci);

-- 2.4: Migrar valores de convenios a zona principal
INSERT INTO financiador_servicio_valores_new (
  financiador_servicio_id, 
  zona_id, 
  precio_facturar,
  fecha_inicio, 
  fecha_fin,
  created_at
)
SELECT 
  fs_new.id,
  COALESCE(stz.zona_id, 1) as zona_id,
  fsv.valor_facturar,
  fsv.fecha_inicio,
  fsv.fecha_fin,
  fsv.created_at
FROM financiador_servicio_valores fsv
JOIN financiador_servicio fs ON fsv.financiador_servicio_id = fs.id
JOIN servicios s ON fs.id_servicio = s.id_servicio
JOIN servicios_unificados su ON su.nombre = s.nombre COLLATE utf8mb4_0900_ai_ci
JOIN financiador_servicio_new fs_new ON fs_new.servicio_id = su.id AND fs_new.financiador_id = fs.financiador_id
LEFT JOIN sucursales_tarifario_zonas stz ON stz.sucursal_id = fsv.sucursal_id AND stz.es_zona_principal = 1;

-- ============================================
-- PASO 3: MODIFICAR TABLAS EXISTENTES
-- ============================================

-- 3.1: Agregar columnas a presupuesto_prestaciones
-- Verificar si ya existen antes de agregar
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'mh_1' AND TABLE_NAME = 'presupuesto_prestaciones' AND COLUMN_NAME = 'servicio_id');

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE presupuesto_prestaciones ADD COLUMN servicio_id INT AFTER idPresupuestos, ADD COLUMN zona_id INT AFTER servicio_id, ADD COLUMN orden_costo TINYINT COMMENT "1-5: orden del costo usado" AFTER zona_id',
  'SELECT "Columnas ya existen" as mensaje');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3.2: Actualizar presupuesto_prestaciones_tarifario
ALTER TABLE presupuesto_prestaciones_tarifario 
DROP FOREIGN KEY presupuesto_prestaciones_tarifario_ibfk_2;

ALTER TABLE presupuesto_prestaciones_tarifario 
CHANGE tarifario_servicio_id servicio_id INT NOT NULL;

-- ============================================
-- PASO 4: RENOMBRAR TABLAS (BACKUP + ACTIVAR NUEVAS)
-- ============================================

-- 4.1: Backup de tablas legacy
RENAME TABLE servicios TO servicios_old;
RENAME TABLE tarifario_servicio TO tarifario_servicio_old;
RENAME TABLE tarifario_servicio_valores TO tarifario_servicio_valores_old;
RENAME TABLE financiador_servicio TO financiador_servicio_old;
RENAME TABLE financiador_servicio_valores TO financiador_servicio_valores_old;

-- 4.2: Activar tablas nuevas
RENAME TABLE servicios_unificados TO servicios;
RENAME TABLE servicios_valores_tarifario TO tarifario_servicio_valores;
RENAME TABLE financiador_servicio_new TO financiador_servicio;
RENAME TABLE financiador_servicio_valores_new TO financiador_servicio_valores;

-- 4.3: Actualizar servicio_id en presupuesto_prestaciones_tarifario
UPDATE presupuesto_prestaciones_tarifario ppt
JOIN tarifario_servicio_old ts ON ppt.servicio_id = ts.id
JOIN servicios su ON su.nombre = ts.nombre COLLATE utf8mb4_0900_ai_ci
SET ppt.servicio_id = su.id;

-- ============================================
-- PASO 5: AGREGAR FOREIGN KEYS A TABLAS MODIFICADAS
-- ============================================

-- 5.1: FKs para presupuesto_prestaciones
ALTER TABLE presupuesto_prestaciones
ADD FOREIGN KEY (servicio_id) REFERENCES servicios(id),
ADD FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id);

-- 5.2: FK para presupuesto_prestaciones_tarifario
ALTER TABLE presupuesto_prestaciones_tarifario 
ADD FOREIGN KEY (servicio_id) REFERENCES servicios(id);

-- 5.3: Agregar índices
ALTER TABLE presupuesto_prestaciones
ADD INDEX idx_servicio (servicio_id),
ADD INDEX idx_zona (zona_id);

-- ============================================
-- PASO 6: VERIFICACIÓN
-- ============================================

-- Verificar conteos
SELECT 'servicios' as tabla, COUNT(*) as registros FROM servicios
UNION ALL
SELECT 'tarifario_servicio_valores', COUNT(*) FROM tarifario_servicio_valores
UNION ALL
SELECT 'financiador_servicio', COUNT(*) FROM financiador_servicio
UNION ALL
SELECT 'financiador_servicio_valores', COUNT(*) FROM financiador_servicio_valores;

COMMIT;

-- ============================================
-- NOTAS POST-MIGRACIÓN
-- ============================================

-- 1. Verificar que los conteos coincidan con las tablas _old
-- 2. Probar endpoints del backend
-- 3. Si todo funciona, después de 1 semana se pueden eliminar tablas _old:
--    DROP TABLE servicios_old;
--    DROP TABLE tarifario_servicio_old;
--    DROP TABLE tarifario_servicio_valores_old;
--    DROP TABLE financiador_servicio_old;
--    DROP TABLE financiador_servicio_valores_old;

-- ROLLBACK (si algo falla):
-- START TRANSACTION;
-- RENAME TABLE servicios TO servicios_new;
-- RENAME TABLE tarifario_servicio_valores TO tarifario_servicio_valores_new;
-- RENAME TABLE financiador_servicio TO financiador_servicio_new;
-- RENAME TABLE financiador_servicio_valores TO financiador_servicio_valores_new;
-- RENAME TABLE servicios_old TO servicios;
-- RENAME TABLE tarifario_servicio_old TO tarifario_servicio;
-- RENAME TABLE tarifario_servicio_valores_old TO tarifario_servicio_valores;
-- RENAME TABLE financiador_servicio_old TO financiador_servicio;
-- RENAME TABLE financiador_servicio_valores_old TO financiador_servicio_valores;
-- COMMIT;
