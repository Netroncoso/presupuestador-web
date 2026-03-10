-- ============================================
-- Migration: Índices Adicionales para Performance
-- Fecha: Enero 2025
-- Descripción: Agrega índices faltantes para mejorar búsquedas y JOINs
-- ============================================

-- Índices en insumos
-- Ya existen: idx_insumos_producto, idx_insumos_critico, idx_insumos_codigo_producto

-- Índices en financiador
CREATE INDEX idx_financiador_activo ON financiador(activo);

-- Índices en servicios
-- Ya existe: nombre (UNIQUE)

-- Índices en equipamientos
CREATE INDEX idx_equipamientos_nombre ON equipamientos(nombre);

-- Índices en usuarios
-- Ya existe: username (UNIQUE)
CREATE INDEX idx_usuarios_activo ON usuarios(activo);

-- Índices en notificaciones
-- Ya existe: idx_notificaciones_usuario_estado
CREATE INDEX idx_notificaciones_creado_en ON notificaciones(creado_en);

-- Índices en auditorias_presupuestos
CREATE INDEX idx_auditorias_fecha ON auditorias_presupuestos(fecha);
-- Ya existe: idx_auditoria_auditor

-- Índices compuestos para queries frecuentes
CREATE INDEX idx_presupuestos_estado_usuario ON presupuestos(estado, usuario_id);
CREATE INDEX idx_presupuestos_financiador_estado ON presupuestos(financiador_id, estado);
CREATE INDEX idx_presupuestos_revisor_estado ON presupuestos(revisor_id, estado);

-- Índices en tablas de valores históricos
-- Ya existe: idx_vigencia en financiador_servicio_valores
-- Ya existe: idx_vigencia en financiador_equipamiento_valores
-- Ya existe: idx_vigencia en tarifario_servicio_valores

-- Índices para búsquedas por DNI
-- Ya existe: idx_presupuestos_dni

-- ============================================
-- Verificación de índices creados
-- ============================================
-- SHOW INDEX FROM insumos;
-- SHOW INDEX FROM financiador;
-- SHOW INDEX FROM servicios;
-- SHOW INDEX FROM equipamientos;
-- SHOW INDEX FROM usuarios;
-- SHOW INDEX FROM notificaciones;
-- SHOW INDEX FROM auditorias_presupuestos;
-- SHOW INDEX FROM presupuestos;
-- SHOW INDEX FROM financiador_servicio_valores;
-- SHOW INDEX FROM financiador_equipamiento_valores;
-- SHOW INDEX FROM tarifario_servicio_valores;
