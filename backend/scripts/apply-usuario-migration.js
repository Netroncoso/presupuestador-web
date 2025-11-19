const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mh_1'
  });

  try {
    console.log('Aplicando migración: add_usuario_to_presupuestos.sql');
    
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_usuario_to_presupuestos.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
        console.log('✓ Ejecutado:', statement.trim().substring(0, 50) + '...');
      }
    }
    
    console.log('✅ Migración aplicada exitosamente');
  } catch (error) {
    console.error('❌ Error aplicando migración:', error.message);
  } finally {
    await connection.end();
  }
}

applyMigration();