-- ============================================================================
-- MIGRACIÓN: ACTUALIZAR ZONA_FINANCIADOR_ID EN PRESUPUESTOS EXISTENTES
-- ============================================================================
-- Fecha: Febrero 2025
-- Descripción: Asignar zona_financiador_id por defecto a presupuestos que tienen NULL
-- ============================================================================

USE mh_1;

-- Iniciar transacción
START TRANSACTION;

-- Actualizar presupuestos que tienen financiador pero no tienen zona_financiador_id
UPDATE presupuestos p
SET zona_financiador_id = 1
WHERE p.financiador_id IS NOT NULL 
  AND p.zona_financiador_id IS NULL;

-- Verificar cuántos registros se actualizaron
SELECT 
    COUNT(*) as presupuestos_actualizados,
    'Presupuestos con zona_financiador_id actualizada' as descripcion
FROM presupuestos 
WHERE financiador_id IS NOT NULL 
  AND zona_financiador_id = 1;

-- Confirmar transacción
COMMIT;

SELECT 'Migración completada: zona_financiador_id actualizada en presupuestos existentes' as status;