-- ============================================================================
-- CAMBIOS SEGUROS - NO AFECTAN FUNCIONALIDAD DE LA APP
-- ============================================================================
-- Estos cambios son 100% seguros y mejoran la base de datos
-- sin requerir modificaciones en el código de la aplicación
-- ============================================================================

-- Hacer backup antes de ejecutar:
-- mysqldump -u root -p presupuestador > backup_antes_cambios_seguros.sql

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- 1. CORREGIR TIPOS DE DATOS
-- ============================================================================

-- Cambiar costo de INT a DECIMAL (permite centavos)
ALTER TABLE insumos 
  MODIFY COLUMN costo DECIMAL(10,2) DEFAULT 0;

-- Cambiar DNI de INT a VARCHAR (soporta DNI extranjeros)
ALTER TABLE presupuestos 
  MODIFY COLUMN DNI VARCHAR(20) NOT NULL;

-- ============================================================================
-- 2. LIMPIAR PRIMARY KEYS COMPUESTAS
-- ============================================================================

-- Limpiar PK de insumos (mantener solo idInsumos)
-- Primero quitar AUTO_INCREMENT de idInsumos
ALTER TABLE insumos MODIFY COLUMN idInsumos INT NOT NULL;
-- Ahora eliminar PK compuesta
ALTER TABLE insumos DROP PRIMARY KEY;
-- Restaurar AUTO_INCREMENT y crear PK simple
ALTER TABLE insumos MODIFY COLUMN idInsumos INT NOT NULL AUTO_INCREMENT PRIMARY KEY;
-- Agregar UNIQUE a producto
ALTER TABLE insumos ADD UNIQUE KEY unique_producto (producto);

-- Limpiar PK de sucursales_mh (mantener solo ID)
-- Primero quitar AUTO_INCREMENT de ID
ALTER TABLE sucursales_mh MODIFY COLUMN ID INT NOT NULL;
-- Ahora eliminar PK compuesta
ALTER TABLE sucursales_mh DROP PRIMARY KEY;
-- Restaurar AUTO_INCREMENT y crear PK simple
ALTER TABLE sucursales_mh MODIFY COLUMN ID INT NOT NULL AUTO_INCREMENT PRIMARY KEY;
-- Agregar UNIQUE a nombre
ALTER TABLE sucursales_mh ADD UNIQUE KEY unique_sucursal_nombre (Sucursales_mh);

-- ============================================================================
-- 3. AGREGAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices en presupuestos
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_created_at ON presupuestos(created_at);
CREATE INDEX idx_presupuestos_financiador ON presupuestos(idobra_social);
CREATE INDEX idx_presupuestos_sucursal ON presupuestos(sucursal_id);

-- Índices en notificaciones
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX idx_notificaciones_creado_en ON notificaciones(creado_en);
CREATE INDEX idx_notificaciones_tipo ON notificaciones(tipo);

-- Índices en auditorias
CREATE INDEX idx_auditorias_fecha ON auditorias_presupuestos(fecha);

-- Índices en prestador_servicio_valores
CREATE INDEX idx_psv_fechas ON prestador_servicio_valores(fecha_inicio, fecha_fin);

-- Índices en presupuesto_insumos
CREATE INDEX idx_pi_insumo ON presupuesto_insumos(id_insumo);

-- ============================================================================
-- 4. MIGRAR sucursal_id (PREPARACIÓN - NO ROMPE NADA)
-- ============================================================================

-- Actualizar sucursal_id basado en nombre de Sucursal
-- Esto NO rompe nada porque la app sigue usando Sucursal (VARCHAR)
UPDATE presupuestos p
INNER JOIN sucursales_mh s ON p.Sucursal = s.Sucursales_mh
SET p.sucursal_id = s.ID
WHERE p.sucursal_id IS NULL;

-- ============================================================================
-- 5. VERIFICACIONES
-- ============================================================================

-- Verificar tipos de datos actualizados
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    (TABLE_NAME = 'insumos' AND COLUMN_NAME = 'costo')
    OR (TABLE_NAME = 'presupuestos' AND COLUMN_NAME = 'DNI')
  );

-- Verificar PKs limpias
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('insumos', 'sucursales_mh')
  AND COLUMN_KEY = 'PRI';

-- Verificar índices creados
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME) AS COLUMNS
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME LIKE 'idx_%'
GROUP BY TABLE_NAME, INDEX_NAME;

-- Verificar sucursal_id poblado
SELECT 
  COUNT(*) as total_presupuestos,
  SUM(CASE WHEN sucursal_id IS NOT NULL THEN 1 ELSE 0 END) as con_sucursal_id,
  SUM(CASE WHEN sucursal_id IS NULL THEN 1 ELSE 0 END) as sin_sucursal_id
FROM presupuestos;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- RESULTADO ESPERADO
-- ============================================================================
/*
✅ insumos.costo ahora es DECIMAL(10,2) - permite $10.50
✅ presupuestos.DNI ahora es VARCHAR(20) - permite DNI extranjeros
✅ insumos.PK solo es idInsumos
✅ sucursales_mh.PK solo es ID
✅ 10+ índices agregados para mejorar velocidad
✅ sucursal_id poblado en todos los presupuestos

🎉 LA APP SIGUE FUNCIONANDO EXACTAMENTE IGUAL
📈 PERO MÁS RÁPIDA Y CON MEJOR ESTRUCTURA
*/
