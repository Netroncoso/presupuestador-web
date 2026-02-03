-- ============================================================================
-- MIGRACIÓN: IMPORTAR VALORES DEL TARIFARIO DESDE CSV
-- ============================================================================
-- Importa 100 registros (10 servicios × 10 zonas) desde tarifario_importar.csv
-- Fecha: Enero 2025
-- ============================================================================

USE mh_1;

-- IMPORTANTE: Ajustar la ruta del archivo CSV según tu sistema
-- Windows: 'C:/Users/ntroncoso/Desktop/presupuestador-web/tarifario_importar.csv'
-- Linux/Mac: '/path/to/presupuestador-web/tarifario_importar.csv'

-- ============================================================================
-- OPCIÓN 1: LOAD DATA INFILE (Requiere permisos FILE en MySQL)
-- ============================================================================

LOAD DATA INFILE 'C:/Users/ntroncoso/Desktop/presupuestador-web/tarifario_importar.csv'
INTO TABLE tarifario_servicio_valores
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(
  @servicio_nombre,
  @zona_nombre,
  costo_1,
  costo_2,
  costo_3,
  costo_4,
  costo_5
)
SET 
  tarifario_servicio_id = (SELECT id FROM tarifario_servicio WHERE nombre = @servicio_nombre),
  zona_id = (SELECT id FROM tarifario_zonas WHERE nombre = @zona_nombre),
  fecha_inicio = CURDATE(),
  fecha_fin = NULL;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 
    z.nombre as zona,
    ts.nombre as servicio,
    tsv.costo_1,
    tsv.costo_2,
    tsv.costo_3,
    tsv.costo_4,
    tsv.costo_5,
    tsv.fecha_inicio,
    tsv.fecha_fin
FROM tarifario_servicio_valores tsv
JOIN tarifario_servicio ts ON tsv.tarifario_servicio_id = ts.id
JOIN tarifario_zonas z ON tsv.zona_id = z.id
ORDER BY ts.nombre, z.nombre;

-- Resultado esperado: 100 filas (10 servicios × 10 zonas)

-- ============================================================================
-- RESUMEN POR SERVICIO
-- ============================================================================

SELECT 
    ts.nombre as servicio,
    COUNT(tsv.id) as zonas_con_valores,
    MIN(tsv.costo_1) as costo_min,
    MAX(tsv.costo_5) as costo_max
FROM tarifario_servicio ts
LEFT JOIN tarifario_servicio_valores tsv ON ts.id = tsv.tarifario_servicio_id
GROUP BY ts.id, ts.nombre
ORDER BY ts.nombre;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- Si LOAD DATA INFILE falla por permisos, usar OPCIÓN 2 (ver abajo)
-- 
-- Error común: "The MySQL server is running with the --secure-file-priv option"
-- Solución: 
-- 1. Verificar ruta permitida: SHOW VARIABLES LIKE 'secure_file_priv';
-- 2. Mover CSV a esa ruta O deshabilitar secure_file_priv en my.ini/my.cnf
-- 3. Reiniciar MySQL
--
-- ============================================================================

-- ============================================================================
-- OPCIÓN 2: INSERT MANUAL (Si LOAD DATA INFILE no funciona)
-- ============================================================================
-- Descomentar y ejecutar si LOAD DATA INFILE falla:

/*
INSERT INTO tarifario_servicio_valores 
(tarifario_servicio_id, zona_id, costo_1, costo_2, costo_3, costo_4, costo_5, fecha_inicio, fecha_fin)
SELECT 
  ts.id,
  z.id,
  2000.00, 2200.00, 2500.00, 2800.00, 3000.00,
  CURDATE(),
  NULL
FROM tarifario_servicio ts
CROSS JOIN tarifario_zonas z
WHERE ts.nombre = 'HORA CUIDADOR' AND z.nombre = 'CABA'

UNION ALL

SELECT ts.id, z.id, 2000.00, 2200.00, 2500.00, 2800.00, 3000.00, CURDATE(), NULL
FROM tarifario_servicio ts CROSS JOIN tarifario_zonas z
WHERE ts.nombre = 'HORA CUIDADOR' AND z.nombre = 'AMBA'

-- ... (continuar con los 98 registros restantes)
-- Ver archivo completo en: backend/migrations/003_importar_valores_manual.sql
*/
