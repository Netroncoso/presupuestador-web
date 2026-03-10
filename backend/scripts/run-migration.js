const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    const migrationPath = path.join(__dirname, '../migrations/017_crear_sistema_zonas_dual.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Ejecutando migración...');
    await connection.execute(sql);
    console.log('✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();