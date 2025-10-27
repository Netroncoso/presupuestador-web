const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'PRUEBAS',
    password: process.env.DB_PASSWORD || 'Medihome2006',
    database: process.env.DB_NAME || 'mh_1'
  });

  try {
    console.log('Adding costo_total column...');
    try {
      await connection.execute(`
        ALTER TABLE presupuestos 
        ADD COLUMN costo_total DECIMAL(10,2) DEFAULT 0
      `);
      console.log('Column costo_total added successfully!');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('Column costo_total already exists.');
      } else {
        throw error;
      }
    }
    console.log('Database updated successfully!');
  } catch (error) {
    console.error('Error updating database:', error.message);
  } finally {
    await connection.end();
  }
}

updateDatabase();