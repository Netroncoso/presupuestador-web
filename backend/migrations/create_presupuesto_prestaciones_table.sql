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