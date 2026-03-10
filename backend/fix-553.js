require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixPresupuesto553() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Limpiando resultado_auditoria del presupuesto 553...');
    
    await connection.query(`
      UPDATE presupuestos 
      SET resultado_auditoria = NULL 
      WHERE idPresupuestos = 553
    `);
    
    console.log('✅ Presupuesto 553 actualizado correctamente');
    
    const [result] = await connection.query(`
      SELECT idPresupuestos, estado, resultado_auditoria 
      FROM presupuestos 
      WHERE idPresupuestos = 553
    `);
    
    console.table(result);

  } finally {
    await connection.end();
  }
}

fixPresupuesto553().catch(console.error);
