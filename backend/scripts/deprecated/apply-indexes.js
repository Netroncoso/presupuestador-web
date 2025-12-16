const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'Presupuestador_Web',
    password: process.env.DB_PASSWORD || '8fv5b1aeT35OVgJj5lxf',
    database: process.env.DB_NAME || 'mh_1',
    multipleStatements: true
  });

  try {
    console.log('Conectado a la base de datos');
    
    const sqlPath = path.join(__dirname, '../migrations/add_indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Aplicando índices...');
    
    const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    let created = 0;
    let skipped = 0;
    
    for (const statement of statements) {
      try {
        await connection.query(statement);
        created++;
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          skipped++;
        } else {
          throw error;
        }
      }
    }
    
    console.log(`✅ Índices aplicados: ${created} creados, ${skipped} ya existían`);
    
    // Verificar índices creados
    const [indexes] = await connection.query(`
      SELECT DISTINCT TABLE_NAME, INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND INDEX_NAME LIKE 'idx_%'
      ORDER BY TABLE_NAME, INDEX_NAME
    `, [process.env.DB_NAME || 'mh_1']);
    
    console.log('\nÍndices creados:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.TABLE_NAME}.${idx.INDEX_NAME}`);
    });
    
  } catch (error) {
    console.error('Error aplicando índices:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyIndexes();
