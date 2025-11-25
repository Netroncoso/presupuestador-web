-- ============================================
-- SCRIPT PARA LIMPIAR PRESUPUESTOS DE PRUEBA
-- ============================================
-- IMPORTANTE: Ejecutar en orden y revisar antes de ejecutar

-- 1. VER QUÉ SE VA A ELIMINAR (EJECUTAR PRIMERO PARA REVISAR)
-- ============================================
SELECT 
    'PRESUPUESTOS' as tabla,
    COUNT(*) as registros_a_eliminar
FROM presupuestos
WHERE idPresupuestos > 0  -- Cambia este número según tu caso

UNION ALL

SELECT 
    'INSUMOS' as tabla,
    COUNT(*) as registros_a_eliminar
FROM presupuesto_insumos
WHERE idPresupuestos IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0)

UNION ALL

SELECT 
    'PRESTACIONES' as tabla,
    COUNT(*) as registros_a_eliminar
FROM presupuesto_prestaciones
WHERE idPresupuestos IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0)

UNION ALL

SELECT 
    'NOTIFICACIONES' as tabla,
    COUNT(*) as registros_a_eliminar
FROM notificaciones
WHERE presupuesto_id IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0)

UNION ALL

SELECT 
    'AUDITORIAS' as tabla,
    COUNT(*) as registros_a_eliminar
FROM auditorias_presupuestos
WHERE presupuesto_id IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0);


-- ============================================
-- 2. ELIMINAR DATOS (EJECUTAR DESPUÉS DE REVISAR)
-- ============================================
-- IMPORTANTE: Descomenta las líneas siguientes SOLO después de revisar

-- Deshabilitar verificación de claves foráneas temporalmente
-- SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar notificaciones relacionadas
-- DELETE FROM notificaciones 
-- WHERE presupuesto_id IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0);

-- Eliminar auditorías relacionadas
-- DELETE FROM auditorias_presupuestos 
-- WHERE presupuesto_id IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0);

-- Eliminar insumos
-- DELETE FROM presupuesto_insumos 
-- WHERE idPresupuestos IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0);

-- Eliminar prestaciones
-- DELETE FROM presupuesto_prestaciones 
-- WHERE idPresupuestos IN (SELECT idPresupuestos FROM presupuestos WHERE idPresupuestos > 0);

-- Eliminar presupuestos
-- DELETE FROM presupuestos 
-- WHERE idPresupuestos > 0;

-- Rehabilitar verificación de claves foráneas
-- SET FOREIGN_KEY_CHECKS = 1;


-- ============================================
-- 3. RESETEAR AUTO_INCREMENT (OPCIONAL)
-- ============================================
-- Solo si quieres que los IDs empiecen desde 1 nuevamente

-- ALTER TABLE presupuestos AUTO_INCREMENT = 1;
-- ALTER TABLE presupuesto_insumos AUTO_INCREMENT = 1;
-- ALTER TABLE presupuesto_prestaciones AUTO_INCREMENT = 1;
-- ALTER TABLE notificaciones AUTO_INCREMENT = 1;
-- ALTER TABLE auditorias_presupuestos AUTO_INCREMENT = 1;


-- ============================================
-- 4. VERIFICAR QUE SE ELIMINÓ TODO
-- ============================================
-- SELECT COUNT(*) as presupuestos_restantes FROM presupuestos;
-- SELECT COUNT(*) as insumos_restantes FROM presupuesto_insumos;
-- SELECT COUNT(*) as prestaciones_restantes FROM presupuesto_prestaciones;
-- SELECT COUNT(*) as notificaciones_restantes FROM notificaciones;
-- SELECT COUNT(*) as auditorias_restantes FROM auditorias_presupuestos;


-- ============================================
-- ALTERNATIVA: ELIMINAR SOLO PRESUPUESTOS ESPECÍFICOS
-- ============================================
-- Si solo quieres eliminar ciertos presupuestos, usa esto:

/*
-- Ver presupuestos específicos
SELECT idPresupuestos, Nombre_Apellido, DNI, estado, created_at 
FROM presupuestos 
ORDER BY idPresupuestos DESC 
LIMIT 20;

-- Eliminar presupuestos específicos (cambia los IDs)
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM notificaciones WHERE presupuesto_id IN (329, 330, 331);
DELETE FROM auditorias_presupuestos WHERE presupuesto_id IN (329, 330, 331);
DELETE FROM presupuesto_insumos WHERE idPresupuestos IN (329, 330, 331);
DELETE FROM presupuesto_prestaciones WHERE idPresupuestos IN (329, 330, 331);
DELETE FROM presupuestos WHERE idPresupuestos IN (329, 330, 331);

SET FOREIGN_KEY_CHECKS = 1;
*/


-- ============================================
-- ALTERNATIVA: ELIMINAR POR FECHA
-- ============================================
-- Eliminar presupuestos creados después de cierta fecha

/*
-- Ver presupuestos por fecha
SELECT idPresupuestos, Nombre_Apellido, estado, created_at 
FROM presupuestos 
WHERE created_at >= '2025-11-25'
ORDER BY created_at DESC;

-- Eliminar por fecha
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM notificaciones 
WHERE presupuesto_id IN (
    SELECT idPresupuestos FROM presupuestos WHERE created_at >= '2025-11-25'
);

DELETE FROM auditorias_presupuestos 
WHERE presupuesto_id IN (
    SELECT idPresupuestos FROM presupuestos WHERE created_at >= '2025-11-25'
);

DELETE FROM presupuesto_insumos 
WHERE idPresupuestos IN (
    SELECT idPresupuestos FROM presupuestos WHERE created_at >= '2025-11-25'
);

DELETE FROM presupuesto_prestaciones 
WHERE idPresupuestos IN (
    SELECT idPresupuestos FROM presupuestos WHERE created_at >= '2025-11-25'
);

DELETE FROM presupuestos 
WHERE created_at >= '2025-11-25';

SET FOREIGN_KEY_CHECKS = 1;
*/


-- ============================================
-- ALTERNATIVA: ELIMINAR SOLO BORRADORES
-- ============================================
-- Eliminar solo presupuestos en estado borrador

/*
-- Ver borradores
SELECT idPresupuestos, Nombre_Apellido, estado, created_at 
FROM presupuestos 
WHERE estado = 'borrador'
ORDER BY created_at DESC;

-- Eliminar borradores
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM notificaciones 
WHERE presupuesto_id IN (
    SELECT idPresupuestos FROM presupuestos WHERE estado = 'borrador'
);

DELETE FROM auditorias_presupuestos 
WHERE presupuesto_id IN (
    SELECT idPresupuestos FROM presupuestos WHERE estado = 'borrador'
);

DELETE FROM presupuesto_insumos 
WHERE idPresupuestos IN (
    SELECT idPresupuestos FROM presupuestos WHERE estado = 'borrador'
);

DELETE FROM presupuesto_prestaciones 
WHERE idPresupuestos IN (
    SELECT idPresupuestos FROM presupuestos WHERE estado = 'borrador'
);

DELETE FROM presupuestos 
WHERE estado = 'borrador';

SET FOREIGN_KEY_CHECKS = 1;
*/
