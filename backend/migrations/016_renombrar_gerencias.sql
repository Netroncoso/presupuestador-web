-- ============================================================================
-- MIGRACIÓN: Renombrar Gerencias
-- Fecha: Enero 2025
-- Descripción: Alinear nomenclatura con terminología del cliente
-- ============================================================================

-- PASO 1: Expandir ENUM de usuarios.rol (agregar nuevos valores)
-- ============================================================================
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_comercial',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',
  'admin'
) DEFAULT 'user';

-- PASO 2: Migrar datos de usuarios
-- ============================================================================
SET SQL_SAFE_UPDATES = 0;
UPDATE usuarios SET rol = 'gerencia_comercial' WHERE rol = 'gerencia_prestacional';
UPDATE usuarios SET rol = 'gerencia_prestacional' WHERE rol = 'gerencia_administrativa';
SET SQL_SAFE_UPDATES = 1;

-- PASO 3: Eliminar valor viejo del ENUM de usuarios.rol
-- ============================================================================
ALTER TABLE usuarios 
MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_prestacional',
  'gerencia_comercial',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',
  'admin'
) DEFAULT 'user';

-- PASO 4: Expandir ENUM de presupuestos.estado
-- ============================================================================
ALTER TABLE presupuestos
MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_comercial',
  'en_revision_comercial',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'pendiente_carga',
  'en_carga',
  'cargado',
  'rechazado'
) DEFAULT 'borrador';

-- PASO 5: Migrar datos de presupuestos
-- ============================================================================
SET SQL_SAFE_UPDATES = 0;
UPDATE presupuestos SET estado = 'pendiente_comercial' WHERE estado = 'pendiente_prestacional';
UPDATE presupuestos SET estado = 'en_revision_comercial' WHERE estado = 'en_revision_prestacional';
UPDATE presupuestos SET estado = 'pendiente_prestacional' WHERE estado = 'pendiente_administrativa';
UPDATE presupuestos SET estado = 'en_revision_prestacional' WHERE estado = 'en_revision_administrativa';
SET SQL_SAFE_UPDATES = 1;

-- PASO 6: Eliminar valores viejos del ENUM de presupuestos.estado
-- ============================================================================
ALTER TABLE presupuestos
MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_comercial',
  'en_revision_comercial',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'pendiente_carga',
  'en_carga',
  'cargado',
  'rechazado'
) DEFAULT 'borrador';

-- PASO 7: Migrar auditorias_presupuestos (estado_anterior)
-- ============================================================================
SET SQL_SAFE_UPDATES = 0;
UPDATE auditorias_presupuestos SET estado_anterior = 'pendiente_comercial' WHERE estado_anterior = 'pendiente_prestacional';
UPDATE auditorias_presupuestos SET estado_anterior = 'en_revision_comercial' WHERE estado_anterior = 'en_revision_prestacional';
UPDATE auditorias_presupuestos SET estado_anterior = 'pendiente_prestacional' WHERE estado_anterior = 'pendiente_administrativa';
UPDATE auditorias_presupuestos SET estado_anterior = 'en_revision_prestacional' WHERE estado_anterior = 'en_revision_administrativa';
SET SQL_SAFE_UPDATES = 1;

-- PASO 8: Migrar auditorias_presupuestos (estado_nuevo)
-- ============================================================================
SET SQL_SAFE_UPDATES = 0;
UPDATE auditorias_presupuestos SET estado_nuevo = 'pendiente_comercial' WHERE estado_nuevo = 'pendiente_prestacional';
UPDATE auditorias_presupuestos SET estado_nuevo = 'en_revision_comercial' WHERE estado_nuevo = 'en_revision_prestacional';
UPDATE auditorias_presupuestos SET estado_nuevo = 'pendiente_prestacional' WHERE estado_nuevo = 'pendiente_administrativa';
UPDATE auditorias_presupuestos SET estado_nuevo = 'en_revision_prestacional' WHERE estado_nuevo = 'en_revision_administrativa';
SET SQL_SAFE_UPDATES = 1;

-- PASO 9: Verificación
-- ============================================================================
SELECT 'Usuarios por rol:' as verificacion;
SELECT rol, COUNT(*) as cantidad FROM usuarios GROUP BY rol;

SELECT 'Presupuestos por estado:' as verificacion;
SELECT estado, COUNT(*) as cantidad FROM presupuestos GROUP BY estado;

SELECT 'Auditorías - Estados anteriores únicos:' as verificacion;
SELECT DISTINCT estado_anterior FROM auditorias_presupuestos WHERE estado_anterior IS NOT NULL ORDER BY estado_anterior;

SELECT 'Auditorías - Estados nuevos únicos:' as verificacion;
SELECT DISTINCT estado_nuevo FROM auditorias_presupuestos WHERE estado_nuevo IS NOT NULL ORDER BY estado_nuevo;

SELECT 'Notificaciones - Tipos únicos:' as verificacion;
SELECT DISTINCT tipo FROM notificaciones ORDER BY tipo;
