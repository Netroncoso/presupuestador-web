-- Migración: Sistema de valores históricos para prestador_servicio
-- Fecha: 2024
-- Descripción: Permite gestionar precios por períodos de vigencia

CREATE TABLE IF NOT EXISTS prestador_servicio_valores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_prestador_servicio INT NOT NULL,
  valor_asignado DECIMAL(10,2) NOT NULL,
  valor_facturar DECIMAL(10,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_prestador_servicio) REFERENCES prestador_servicio(id_prestador_servicio) ON DELETE CASCADE,
  INDEX idx_prestador_servicio_fechas (id_prestador_servicio, fecha_inicio, fecha_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Limpiar datos anteriores si existen
DELETE FROM prestador_servicio_valores;

-- Migrar valores actuales como primer período histórico
INSERT INTO prestador_servicio_valores (id_prestador_servicio, valor_asignado, valor_facturar, fecha_inicio)
SELECT 
  ps.id_prestador_servicio,
  COALESCE(ps.valor_sugerido, 0),
  COALESCE(ps.valor_facturar, 0),
  '2024-01-01'
FROM prestador_servicio ps
WHERE ps.activo = 1;
