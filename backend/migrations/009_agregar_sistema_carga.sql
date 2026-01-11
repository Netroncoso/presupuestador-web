-- ============================================================================
-- MIGRACIÓN: Sistema de Carga Post-Aprobación
-- Fecha: Enero 2025
-- Base de datos: mh_1
-- ============================================================================

USE mh_1;

-- ============================================================================
-- PASO 1: AGREGAR NUEVOS ESTADOS
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
  'pendiente_carga',        -- NUEVO: Esperando ser tomado por operador
  'en_carga',              -- NUEVO: Siendo procesado por operador
  'cargado',               -- NUEVO: Completado en sistema externo
  'rechazado'
) DEFAULT 'borrador';

-- ============================================================================
-- PASO 2: AGREGAR NUEVO ROL
-- ============================================================================

ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',        -- NUEVO: Personal de oficinas centrales
  'admin'
) DEFAULT 'user';

-- ============================================================================
-- PASO 3: AGREGAR CAMPO DE REFERENCIA EXTERNA
-- ============================================================================

ALTER TABLE presupuestos 
ADD COLUMN referencia_externa VARCHAR(255) NULL 
COMMENT 'Referencia/ID en Softwerk para búsqueda';

-- ============================================================================
-- PASO 4: ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para operadores de carga
CREATE INDEX idx_estado_carga ON presupuestos(estado);

-- Índice para búsqueda por referencia externa
CREATE INDEX idx_referencia_externa ON presupuestos(referencia_externa);

-- ============================================================================
-- PASO 5: VERIFICACIÓN
-- ============================================================================

-- Verificar nuevos estados
SHOW COLUMNS FROM presupuestos LIKE 'estado';

-- Verificar nuevos roles
SHOW COLUMNS FROM usuarios LIKE 'rol';

-- Verificar nueva columna
SHOW COLUMNS FROM presupuestos LIKE 'referencia_externa';

-- Verificar índices
SHOW INDEX FROM presupuestos WHERE Key_name IN ('idx_estado_carga', 'idx_referencia_externa');

SELECT 'Migración completada exitosamente' AS resultado;

-- ============================================================================
-- CREAR USUARIO OPERADOR DE PRUEBA
-- ============================================================================
-- NOTA: Ejecutar después: node hash-passwords.js operador_carga 123456

INSERT INTO usuarios (username, password, rol, activo, sucursal_id) 
VALUES ('operador_carga', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operador_carga', 1, 1)
ON DUPLICATE KEY UPDATE rol = 'operador_carga';

SELECT 'Usuario operador de prueba creado (password: hello)' AS resultado;