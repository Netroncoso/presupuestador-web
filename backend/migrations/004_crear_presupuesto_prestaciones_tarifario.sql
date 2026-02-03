-- ============================================================================
-- MIGRACIÓN: CREAR TABLA presupuesto_prestaciones_tarifario
-- ============================================================================
-- Nueva tabla para servicios del tarifario (separada de convenios)
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- CREAR TABLA presupuesto_prestaciones_tarifario
-- ============================================================================

CREATE TABLE IF NOT EXISTS presupuesto_prestaciones_tarifario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  idPresupuestos INT NOT NULL COMMENT 'FK → presupuestos.idPresupuestos',
  tarifario_servicio_id INT NOT NULL COMMENT 'FK → tarifario_servicio.id',
  prestacion VARCHAR(255) NOT NULL COMMENT 'Nombre del servicio',
  cantidad INT NOT NULL COMMENT 'Cantidad de unidades',
  zona_id INT NOT NULL COMMENT 'FK → tarifario_zonas.id',
  orden_costo TINYINT NOT NULL COMMENT 'Orden del costo usado (1-5)',
  valor_asignado DECIMAL(10,2) NOT NULL COMMENT 'Costo prestacional',
  valor_facturar DECIMAL(10,2) NOT NULL COMMENT 'Valor con markup aplicado',
  fuera_tarifario TINYINT(1) DEFAULT 0 COMMENT 'Usuario editó costo manualmente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (idPresupuestos) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
  FOREIGN KEY (tarifario_servicio_id) REFERENCES tarifario_servicio(id),
  FOREIGN KEY (zona_id) REFERENCES tarifario_zonas(id),
  KEY idx_presupuesto (idPresupuestos),
  KEY idx_servicio (tarifario_servicio_id),
  KEY idx_zona (zona_id),
  KEY idx_fuera_tarifario (fuera_tarifario),
  KEY idx_orden_costo (orden_costo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SHOW CREATE TABLE presupuesto_prestaciones_tarifario;

-- Verificar columnas
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'presupuesto_prestaciones_tarifario'
ORDER BY ORDINAL_POSITION;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- SEPARACIÓN DE RESPONSABILIDADES:
-- - presupuesto_prestaciones: Servicios con convenio (financiador)
-- - presupuesto_prestaciones_tarifario: Servicios del tarifario interno
--
-- CÁLCULO DE TOTALES:
-- - total_prestaciones = SUM(presupuesto_prestaciones) + SUM(presupuesto_prestaciones_tarifario)
-- - Backend debe sumar ambas tablas al calcular totales
--
-- CAMPOS CLAVE:
-- - orden_costo: 1-5 (5 = valor más alto → auditoría prestacional)
-- - fuera_tarifario: 1 = usuario editó manualmente
-- - valor_asignado: costo prestacional del tarifario
-- - valor_facturar: valor_asignado * (1 + markup/100)
--
-- VENTAJAS DE TABLA SEPARADA:
-- ✅ Cero riesgo de romper código existente
-- ✅ Separación clara de responsabilidades
-- ✅ Más fácil de mantener y debuggear
-- ✅ Rollback simple (solo DROP TABLE)
--
-- ============================================================================
