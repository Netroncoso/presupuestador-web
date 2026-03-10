require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync('./migrations/010_optimize_presupuesto_queries.sql', 'utf8');
    
    console.log('Ejecutando migración de optimización...\n');
    await connection.query(sql);
    console.log('✅ Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);
