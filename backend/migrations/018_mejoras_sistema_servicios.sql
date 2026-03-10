-- ============================================
-- Migración 018: Mejoras Sistema de Servicios
-- ============================================
-- Fecha: 11 de Febrero de 2025
-- Descripción: 
--   1. Unidades base para servicios combo
--   2. Recargo por horas nocturnas (global + flag)
--   3. Recargo por difícil acceso (por financiador)
--   4. Histórico de recargos aplicados
-- ============================================

USE mh_1;

-- ============================================
-- 1. UNIDADES BASE PARA COMBOS
-- ============================================
-- Permite calcular correctamente el costo de servicios "combo"
-- Ejemplo: "Guardia 4 hs" = 4 unidades del tarifario "Hora cuidador"

ALTER TABLE financiador_servicio
ADD COLUMN unidades_base DECIMAL(10,2) DEFAULT 1 
COMMENT 'Cantidad de unidades del tarifario que componen este servicio';

-- ============================================
-- 2. RECARGO POR HORAS NOCTURNAS
-- ============================================

-- 2a. Porcentaje global en financiador
ALTER TABLE financiador
ADD COLUMN porcentaje_horas_nocturnas DECIMAL(5,2) DEFAULT 0 
COMMENT 'Recargo % por horas nocturnas (aplica a servicios que lo permitan)';

-- 2b. Flag por servicio: ¿admite recargo nocturno?
ALTER TABLE financiador_servicio
ADD COLUMN admite_horas_nocturnas TINYINT(1) DEFAULT 0 
COMMENT 'Flag: si este servicio admite recargo por horas nocturnas';

-- ============================================
-- 3. RECARGO POR DIFÍCIL ACCESO
-- ============================================
-- Mover de sucursal a financiador (donde corresponde)

ALTER TABLE financiador 
ADD COLUMN porcentaje_dificil_acceso DECIMAL(5,2) DEFAULT 0 
COMMENT 'Recargo % por zona desfavorable (aplica a todos los servicios)';

-- ============================================
-- 4. HISTÓRICO DE RECARGOS APLICADOS
-- ============================================
-- Guardar qué recargos se aplicaron en cada presupuesto

ALTER TABLE presupuesto_prestaciones
ADD COLUMN aplicar_horas_nocturnas TINYINT(1) DEFAULT 0 
COMMENT 'Flag: si se aplicó recargo por horas nocturnas',
ADD COLUMN porcentaje_aplicado DECIMAL(5,2) DEFAULT 0 
COMMENT 'Porcentaje de recargo aplicado (para histórico)';

-- ============================================
-- 5. ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX idx_financiador_servicio_unidades 
ON financiador_servicio(unidades_base);

CREATE INDEX idx_financiador_servicio_nocturnas 
ON financiador_servicio(admite_horas_nocturnas);

CREATE INDEX idx_prestaciones_nocturnas 
ON presupuesto_prestaciones(aplicar_horas_nocturnas);

-- ============================================
-- 6. DATOS DE EJEMPLO (OPCIONAL)
-- ============================================
-- Descomentar para poblar con datos de ejemplo

-- Ejemplo: Configurar servicios combo
-- UPDATE financiador_servicio SET unidades_base = 4 WHERE nombre LIKE '%4 hs%';
-- UPDATE financiador_servicio SET unidades_base = 8 WHERE nombre LIKE '%8 hs%';
-- UPDATE financiador_servicio SET unidades_base = 12 WHERE nombre LIKE '%12 hs%';

-- Ejemplo: Marcar servicios que admiten recargo nocturno
-- UPDATE financiador_servicio SET admite_horas_nocturnas = 1 
-- WHERE nombre LIKE '%cuidador%' OR nombre LIKE '%enfermería%';

-- Ejemplo: Configurar porcentajes en financiadores
-- UPDATE financiador SET porcentaje_horas_nocturnas = 30 WHERE id = 5;
-- UPDATE financiador SET porcentaje_dificil_acceso = 15 WHERE id = 5;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar columnas agregadas
SELECT 
    'financiador_servicio' as tabla,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'financiador_servicio'
  AND COLUMN_NAME IN ('unidades_base', 'admite_horas_nocturnas');

SELECT 
    'financiador' as tabla,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'financiador'
  AND COLUMN_NAME IN ('porcentaje_horas_nocturnas', 'porcentaje_dificil_acceso');

SELECT 
    'presupuesto_prestaciones' as tabla,
    COLUMN_NAME,
    COLUMN_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'mh_1' 
  AND TABLE_NAME = 'presupuesto_prestaciones'
  AND COLUMN_NAME IN ('aplicar_horas_nocturnas', 'porcentaje_aplicado');

-- Verificar índices creados
SHOW INDEX FROM financiador_servicio 
WHERE Key_name IN ('idx_financiador_servicio_unidades', 'idx_financiador_servicio_nocturnas');

SHOW INDEX FROM presupuesto_prestaciones 
WHERE Key_name = 'idx_prestaciones_nocturnas';

-- ============================================
-- FIN DE MIGRACIÓN 018
-- ============================================
