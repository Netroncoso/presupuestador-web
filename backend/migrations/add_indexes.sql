-- Índices para optimizar queries frecuentes en presupuestador-web
-- MySQL no soporta IF NOT EXISTS en CREATE INDEX, se manejan errores en el script

-- Índice en DNI para búsquedas rápidas de presupuestos por paciente
CREATE INDEX idx_presupuestos_dni ON presupuestos(DNI);

-- Índice en fecha de creación para ordenamiento y filtrado por fecha
CREATE INDEX idx_presupuestos_created_at ON presupuestos(created_at);

-- Índice en sucursal para filtros por sucursal
CREATE INDEX idx_presupuestos_sucursal ON presupuestos(Sucursal);

-- Índice en idobra_social para joins con financiadores
CREATE INDEX idx_presupuestos_obra_social ON presupuestos(idobra_social);

-- Índice en idPresupuestos para presupuesto_insumos (FK)
CREATE INDEX idx_presupuesto_insumos_id ON presupuesto_insumos(idPresupuestos);

-- Índice en idPresupuestos para presupuesto_prestaciones (FK)
CREATE INDEX idx_presupuesto_prestaciones_id ON presupuesto_prestaciones(idPresupuestos);

-- Índice en id_servicio para presupuesto_prestaciones
CREATE INDEX idx_presupuesto_prestaciones_servicio ON presupuesto_prestaciones(id_servicio);

-- Índice compuesto para búsquedas por DNI y fecha
CREATE INDEX idx_presupuestos_dni_fecha ON presupuestos(DNI, created_at);

-- Índice en username para login rápido
CREATE INDEX idx_usuarios_username ON usuarios(username);

-- Índice en activo para filtrar usuarios activos
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
