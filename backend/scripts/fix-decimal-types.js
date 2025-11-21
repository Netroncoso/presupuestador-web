const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function fixDecimalTypes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'presupuestador'
  });

  try {
    console.log('🔧 Aplicando corrección de tipos de datos...');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', 'fix_presupuestos_decimal_types.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Ejecutar cada statement por separado
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Ejecutando: ${statement.trim().substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }
    
    console.log('✅ Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en la migración:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  fixDecimalTypes().catch(console.error);
}

module.exports = { fixDecimalTypes };