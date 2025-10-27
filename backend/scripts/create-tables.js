const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'PRUEBAS',
    password: process.env.DB_PASSWORD || 'Medihome2006',
    database: process.env.DB_NAME || 'mh_1'
  });

  try {
    console.log('Creating presupuesto_insumos table...');
    await connection.execute(`
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
      )
    `);

    console.log('Creating presupuesto_prestaciones table...');
    await connection.execute(`
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
      )
    `);

    console.log('Tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error.message);
  } finally {
    await connection.end();
  }
}

createTables();