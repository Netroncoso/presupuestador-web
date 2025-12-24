-- ============================================================================
-- MIGRACIÓN: Módulo de Equipamiento
-- Fecha: Enero 2025
-- Base de datos: mh_1
-- ============================================================================

USE mh_1;

-- ============================================================================
-- 1. TABLA: equipamientos (Catálogo Maestro)
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipamientos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  tipo ENUM('oxigenoterapia', 'mobiliario', 'monitoreo', 'ventilacion', 'otro') DEFAULT 'otro',
  precio_referencia DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Precio por defecto si no hay acuerdo',
  unidad_tiempo ENUM('mensual', 'diario', 'semanal') DEFAULT 'mensual',
  genera_alerta BOOLEAN DEFAULT FALSE,
  umbral_alerta INT DEFAULT NULL COMMENT 'Cantidad que dispara alerta',
  mensaje_alerta VARCHAR(255) DEFAULT NULL,
  color_alerta VARCHAR(20) DEFAULT 'orange',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_activo (activo),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. TABLA: financiador_equipamiento (Acuerdos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS financiador_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idobra_social INT NOT NULL,
  id_equipamiento INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idobra_social) REFERENCES financiador(idobra_social) ON DELETE CASCADE,
  FOREIGN KEY (id_equipamiento) REFERENCES equipamientos(id) ON DELETE CASCADE,
  UNIQUE KEY unique_financiador_equipo (idobra_social, id_equipamiento),
  INDEX idx_financiador (idobra_social),
  INDEX idx_equipamiento (id_equipamiento),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. TABLA: financiador_equipamiento_valores (Valores Históricos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS financiador_equipamiento_valores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_financiador_equipamiento INT NOT NULL,
  valor_asignado DECIMAL(10,2) NOT NULL COMMENT 'Costo del equipamiento',
  valor_facturar DECIMAL(10,2) NOT NULL COMMENT 'Precio a facturar',
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE DEFAULT NULL,
  sucursal_id INT DEFAULT NULL COMMENT 'NULL = todas las sucursales',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_financiador_equipamiento) REFERENCES financiador_equipamiento(id) ON DELETE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID) ON DELETE SET NULL,
  INDEX idx_financiador_equipo (id_financiador_equipamiento),
  INDEX idx_fecha_inicio (fecha_inicio),
  INDEX idx_fecha_fin (fecha_fin),
  INDEX idx_sucursal (sucursal_id),
  INDEX idx_vigencia (fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. TABLA: presupuesto_equipamiento (Equipos en Presupuesto)
-- ============================================================================

CREATE TABLE IF NOT EXISTS presupuesto_equipamiento (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idPresupuestos INT NOT NULL,
  id_equipamiento INT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  costo DECIMAL(10,2) NOT NULL COMMENT 'Precio usado: acuerdo o manual',
  precio_facturar DECIMAL(10,2) NOT NULL COMMENT 'Precio final',
  tiene_acuerdo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idPresupuestos) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
  FOREIGN KEY (id_equipamiento) REFERENCES equipamientos(id) ON DELETE RESTRICT,
  INDEX idx_presupuesto (idPresupuestos),
  INDEX idx_equipamiento (id_equipamiento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. AGREGAR COLUMNA A presupuestos
-- ============================================================================

SET @col_exists = (
  SELECT COUNT(*) 
  FROM information_schema.COLUMNS 
  WHERE TABLE_SCHEMA = 'mh_1' 
    AND TABLE_NAME = 'presupuestos' 
    AND COLUMN_NAME = 'total_equipamiento'
);

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE presupuestos ADD COLUMN total_equipamiento DECIMAL(10,2) DEFAULT 0.00 AFTER total_prestaciones',
  'SELECT "Columna total_equipamiento ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Tablas creadas correctamente' AS resultado;

SHOW TABLES LIKE '%equipamiento%';

SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME IN ('equipamientos', 'financiador_equipamiento', 'financiador_equipamiento_valores', 'presupuesto_equipamiento')
ORDER BY TABLE_NAME, ORDINAL_POSITION;
