-- Tabla para configuración del sistema (reglas de negocio editables)
CREATE TABLE IF NOT EXISTS configuracion_sistema (
  id INT PRIMARY KEY AUTO_INCREMENT,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  descripcion VARCHAR(255),
  categoria VARCHAR(50),
  unidad VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar valores por defecto (migración desde BusinessRules)
INSERT INTO configuracion_sistema (clave, valor, descripcion, categoria, unidad) VALUES
('auditoria.rentabilidadMinima', 15, 'Rentabilidad mínima para evitar auditoría', 'auditoria', '%'),
('auditoria.costoMaximo', 150000, 'Costo máximo para evitar auditoría', 'auditoria', '$'),
('auditoria.rentabilidadConPlazoMaxima', 25, 'Rentabilidad con plazo máxima para evitar auditoría', 'auditoria', '%'),
('financiero.diasCobranzaDefault', 30, 'Días de cobranza por defecto', 'financiero', 'días'),
('financiero.tasaMensualDefault', 2, 'Tasa mensual por defecto', 'financiero', '%'),
('paginacion.limitDefault', 100, 'Límite de registros por página', 'paginacion', 'registros'),
('paginacion.offsetDefault', 0, 'Offset inicial para paginación', 'paginacion', 'registros')
AS new_values
ON DUPLICATE KEY UPDATE valor = new_values.valor;
