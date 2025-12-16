const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'PRUEBAS',
    password: process.env.DB_PASSWORD || 'Medihome2006',
    database: process.env.DB_NAME || 'mh_1'
  });

  try {
    console.log('Checking presupuestos table structure...');
    const [columns] = await connection.execute('DESCRIBE presupuestos');
    console.log('Table columns:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    console.log('\nChecking if idobra_social column exists...');
    const hasColumn = columns.some(col => col.Field === 'idobra_social');
    console.log('idobra_social column exists:', hasColumn);

    if (!hasColumn) {
      console.log('Adding idobra_social column...');
      await connection.execute('ALTER TABLE presupuestos ADD COLUMN idobra_social VARCHAR(50) NULL');
      console.log('Column added successfully!');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkTable();