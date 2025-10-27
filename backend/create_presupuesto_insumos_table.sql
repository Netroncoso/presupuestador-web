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