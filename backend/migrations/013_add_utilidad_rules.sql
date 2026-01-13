-- Migración: Agregar reglas de utilidad (mínima baja y máxima alta)
-- Fecha: Enero 2025
-- Descripción: Agrega umbrales de auditoría y alertas para utilidad

-- 1. Agregar umbral de auditoría para utilidad muy baja
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad) VALUES
('auditoria.utilidadMinimaBaja', 5000, 'Utilidad mínima baja para enviar a auditoría (sospecha error)', 'auditoria', '$')
ON DUPLICATE KEY UPDATE valor = valor;

-- 2. Renombrar utilidadMinima a utilidadMaxima para claridad (mantener valor actual)
-- Nota: La regla actual utilidadMinima funciona como máxima (> valor → auditoría)
-- Por compatibilidad, mantenemos ambas

-- 3. Agregar alertas de utilidad (visuales, no bloquean)
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad) VALUES
('alerta.utilidad.critica', 1000, 'Utilidad crítica (muy baja, alerta roja)', 'alerta', '$'),
('alerta.utilidad.baja', 10000, 'Utilidad baja (alerta naranja)', 'alerta', '$'),
('alerta.utilidad.buena', 30000, 'Utilidad buena (alerta verde)', 'alerta', '$'),
('alerta.utilidad.excelente', 30000, 'Utilidad excelente (alerta violeta)', 'alerta', '$')
ON DUPLICATE KEY UPDATE valor = valor;

-- Verificar configuración
SELECT * FROM configuracion_sistema WHERE clave LIKE '%utilidad%' ORDER BY categoria, clave;
