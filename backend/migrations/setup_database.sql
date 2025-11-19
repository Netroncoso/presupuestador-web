-- Add columns to presupuestos table if they don't exist
ALTER TABLE presupuestos 
ADD COLUMN IF NOT EXISTS idobra_social VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS costo_total DECIMAL(10,2) DEFAULT 0,
ADD INDEX IF NOT EXISTS idx_idobra_social (idobra_social);

-- Create presupuesto_insumos table
CREATE TABLE IF NOT EXISTS presupuesto_insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idPresupuestos INT NOT NULL,
  producto VARCHAR(255) NOT NULL,
  costo DECIMAL(10,2) NOT NULL,
  cantidad INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_presupuesto_producto (idPresupuestos, producto),
  FOREIGN KEY (idPresupuestos) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE
);

-- Create presupuesto_prestaciones table
CREATE TABLE IF NOT EXISTS presupuesto_prestaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idPresupuestos INT NOT NULL,
  id_servicio VARCHAR(50) NOT NULL,
  prestacion VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL,
  valor_asignado DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_presupuesto_prestacion (idPresupuestos, id_servicio),
  FOREIGN KEY (idPresupuestos) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE
);