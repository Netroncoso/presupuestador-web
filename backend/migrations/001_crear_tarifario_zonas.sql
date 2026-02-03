-- ============================================================================
-- MIGRACIÓN: TARIFARIO - ZONAS Y MAPEO A SUCURSALES
-- ============================================================================
-- Basado en Tarifarioactual.xlsx y sucursales_mh actuales
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- 1. CREAR TABLA DE ZONAS DEL TARIFARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS tarifario_zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL UNIQUE COMMENT 'Ej: CABA, AMBA, CENTRO, REG AC',
  descripcion TEXT,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. INSERTAR ZONAS DEL TARIFARIO (10 zonas del Excel)
-- ============================================================================

INSERT INTO tarifario_zonas (nombre, descripcion) VALUES
('CABA', 'Ciudad Autónoma de Buenos Aires'),
('AMBA', 'Área Metropolitana de Buenos Aires'),
('La Plata', 'La Plata'),
('Saladillo', 'Saladillo'),
('Centro', 'Bahía Blanca - Zona Centro'),
('Reg AC', 'Bahía Blanca - Región AC'),
('Salta', 'Salta'),
('Tandil', 'Tandil'),
('Mar de Ajo', 'Mar de Ajo'),
('Rojas', 'Rojas');

-- 3. CREAR TABLA DE RELACIÓN SUCURSALES-ZONAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS sucursales_tarifario_zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  sucursal_id INT NOT NULL,
  zona_id INT NOT NULL,
  es_zona_principal TINYINT(1) DEFAULT 0 COMMENT 'Zona por defecto de la sucursal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales_mh(ID),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  UNIQUE KEY idx_sucursal_zona (sucursal_id, zona_id),
  KEY idx_principal (sucursal_id, es_zona_principal)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. MAPEAR SUCURSALES A ZONAS DEL TARIFARIO
-- ============================================================================
-- IMPORTANTE: Solo las sucursales que tienen datos en el tarifario Excel

INSERT INTO sucursales_tarifario_zonas (sucursal_id, zona_id, es_zona_principal) VALUES
-- Bahía Blanca (ID=1) -> 2 zonas
(1, 5, 1),   -- Bahía Blanca -> CENTRO (principal)
(1, 6, 0),   -- Bahía Blanca -> REG AC (secundaria)

-- Caba (ID=2) -> CABA
(2, 1, 1),   -- Caba -> CABA (principal)

-- La plata (ID=5) -> LA PLATA
(5, 3, 1),   -- La plata -> LA PLATA (principal)

-- Mar de Ajo (ID=7) -> MAR DE AJO
(7, 9, 1),   -- Mar de Ajo -> MAR DE AJO (principal)

-- Rojas (ID=10) -> ROJAS
(10, 10, 1), -- Rojas -> ROJAS (principal)

-- Salta (ID=11) -> SALTA
(11, 7, 1),  -- Salta -> SALTA (principal)

-- Saladillo (ID=12) -> SALADILLO
(12, 4, 1),  -- Saladillo -> SALADILLO (principal)

-- Tandil (ID=15) -> TANDIL
(15, 8, 1),  -- Tandil -> TANDIL (principal)

-- Amba (ID=16) -> AMBA
(16, 2, 1);  -- Amba -> AMBA (principal)

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- SUCURSALES SIN DATOS EN TARIFARIO (no se mapean):
-- - ID=3:  Córdoba
-- - ID=4:  Entrerios
-- - ID=6:  Lomas
-- - ID=8:  Mar del Plata
-- - ID=9:  Mendoza
-- - ID=13: San justo
-- - ID=14: Santa Fe
-- - ID=17: Patagonia
--
-- Estas sucursales NO tendrán zonas asignadas hasta que se agreguen
-- al tarifario. Los usuarios de estas sucursales NO podrán usar
-- el módulo de "Prestaciones por Presupuesto (Tarifario)".
--
-- CASO ESPECIAL:
-- - Bahía Blanca es la ÚNICA sucursal con 2 zonas (CENTRO y REG AC)
-- - CENTRO está marcada como principal (se preselecciona automáticamente)
-- - Usuario puede cambiar a REG AC si lo necesita
--
-- ============================================================================

-- 5. VERIFICACIÓN
-- ============================================================================

SELECT 
    s.ID,
    s.Sucursales_mh,
    GROUP_CONCAT(z.nombre ORDER BY stz.es_zona_principal DESC SEPARATOR ', ') as zonas,
    MAX(stz.es_zona_principal) as tiene_zona_principal
FROM sucursales_mh s
LEFT JOIN sucursales_tarifario_zonas stz ON s.ID = stz.sucursal_id
LEFT JOIN tarifario_zonas z ON stz.zona_id = z.id
GROUP BY s.ID, s.Sucursales_mh
ORDER BY s.ID;

-- Resultado esperado:
-- ID=1  Bahia Blanca  -> CENTRO, REG AC (tiene_zona_principal=1)
-- ID=2  Caba          -> CABA (tiene_zona_principal=1)
-- ID=5  La plata      -> LA PLATA (tiene_zona_principal=1)
-- ID=7  Mar de Ajo    -> MAR DE AJO (tiene_zona_principal=1)
-- ID=10 Rojas         -> ROJAS (tiene_zona_principal=1)
-- ID=11 Salta         -> SALTA (tiene_zona_principal=1)
-- ID=12 Saladillo     -> SALADILLO (tiene_zona_principal=1)
-- ID=15 Tandil        -> TANDIL (tiene_zona_principal=1)
-- ID=16 Amba          -> AMBA (tiene_zona_principal=1)
-- Resto -> NULL (sin zonas asignadas)
