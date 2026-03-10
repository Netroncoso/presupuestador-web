-- Migración: Optimizar queries de presupuestos
-- Fecha: 2026-02-05
-- Descripción: Agregar índices compuestos para mejorar performance de GET /presupuestos/:id

-- Índices para presupuesto_insumos
CREATE INDEX idx_presupuesto_insumos_presupuesto 
ON presupuesto_insumos(idPresupuestos);

-- Índices para presupuesto_prestaciones
CREATE INDEX idx_presupuesto_prestaciones_presupuesto 
ON presupuesto_prestaciones(idPresupuestos);

-- Índices para presupuesto_equipamiento
CREATE INDEX idx_presupuesto_equipamiento_presupuesto 
ON presupuesto_equipamiento(idPresupuestos);

-- Índices para presupuesto_prestaciones_tarifario
CREATE INDEX idx_presupuesto_prestaciones_tarifario_presupuesto 
ON presupuesto_prestaciones_tarifario(idPresupuestos);
