const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDB() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('✅ Conexión exitosa a la base de datos');
    
    // Verificar tablas
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nTablas disponibles:', tables.length);
    
    // Verificar presupuestos
    const [presupuestos] = await connection.query('SELECT COUNT(*) as count FROM presupuestos');
    console.log('Presupuestos en BD:', presupuestos[0].count);
    
    // Verificar estructura de presupuestos
    const [columns] = await connection.query('DESCRIBE presupuestos');
    console.log('\nColumnas de presupuestos:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDB();
