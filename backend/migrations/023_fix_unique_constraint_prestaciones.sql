-- Migration 023: Modificar constraint UNIQUE para permitir mismo servicio con diferentes configuraciones
-- Fecha: 2026-02-18
-- Descripción: Eliminar UNIQUE(idPresupuestos, id_servicio) y crear nuevo con aplicar_horas_nocturnas

-- Eliminar constraint UNIQUE antiguo
ALTER TABLE presupuesto_prestaciones 
DROP INDEX unique_presupuesto_prestacion;

-- Crear nuevo constraint UNIQUE que incluye aplicar_horas_nocturnas
ALTER TABLE presupuesto_prestaciones 
ADD UNIQUE KEY unique_presupuesto_prestacion_config (idPresupuestos, servicio_id, aplicar_horas_nocturnas);
