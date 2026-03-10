-- ============================================================================
-- MIGRACIÓN 011: Sistema de Evaluación de Auditoría v4.0
-- ============================================================================
-- Fecha: Enero 2025
-- Descripción: Agregar soporte para múltiples razones de auditoría y flags

-- Agregar columnas para almacenar razones de auditoría
ALTER TABLE presupuestos 
ADD COLUMN razones_auditoria JSON COMMENT 'Razones detalladas por las que requiere auditoría',
ADD COLUMN tiene_orden_5 TINYINT DEFAULT 0 COMMENT 'Flag: contiene servicios con orden 5',
ADD COLUMN tiene_insumos_criticos TINYINT DEFAULT 0 COMMENT 'Flag: contiene insumos críticos';

-- Índices para mejorar consultas
CREATE INDEX idx_presupuestos_tiene_orden_5 ON presupuestos(tiene_orden_5);
CREATE INDEX idx_presupuestos_tiene_insumos_criticos ON presupuestos(tiene_insumos_criticos);

-- Índice funcional para consultas JSON (MySQL 8.0+)
-- ALTER TABLE presupuestos ADD INDEX idx_razones_tipo ((CAST(razones_auditoria->'$.razones[*].tipo' AS CHAR(50) ARRAY)));

-- Comentarios para documentación
ALTER TABLE presupuestos COMMENT = 'Tabla principal de presupuestos con sistema de auditoría v4.0';

-- Verificar estructura
DESCRIBE presupuestos;

-- Ejemplo de uso del campo JSON
-- INSERT INTO presupuestos (razones_auditoria) VALUES (
--   JSON_OBJECT(
--     'razones', JSON_ARRAY(
--       JSON_OBJECT('tipo', 'rentabilidad_baja', 'valor', 8.5, 'umbral', 15, 'mensaje', 'Rentabilidad 8.5% < 15%'),
--       JSON_OBJECT('tipo', 'orden_5', 'servicios', JSON_ARRAY('Cuidador nocturno'), 'mensaje', 'Servicios con valor más alto')
--     ),
--     'evaluado_en', NOW(),
--     'total_violaciones', 2,
--     'tipo_evaluacion', 'automatica'
--   )
-- );

-- Consultas de ejemplo para verificar funcionalidad JSON
-- SELECT idPresupuestos, JSON_PRETTY(razones_auditoria) FROM presupuestos WHERE razones_auditoria IS NOT NULL;
-- SELECT * FROM presupuestos WHERE JSON_EXTRACT(razones_auditoria, '$.total_violaciones') > 2;
-- SELECT * FROM presupuestos WHERE JSON_CONTAINS(razones_auditoria, '"orden_5"', '$.razones[*].tipo');