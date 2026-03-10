require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkPresupuesto() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('\n=== PRESUPUESTO 553 ===\n');
    
    const [presupuesto] = await connection.query(`
      SELECT * FROM presupuestos WHERE idPresupuestos = 553
    `);
    console.table(presupuesto);

    console.log('\n=== INSUMOS ===\n');
    const [insumos] = await connection.query(`
      SELECT * FROM presupuesto_insumos WHERE idPresupuestos = 553
    `);
    console.table(insumos);

    console.log('\n=== PRESTACIONES (CONVENIO) ===\n');
    const [prestaciones] = await connection.query(`
      SELECT * FROM presupuesto_prestaciones WHERE idPresupuestos = 553
    `);
    console.table(prestaciones);

    console.log('\n=== PRESTACIONES (TARIFARIO) ===\n');
    const [tarifario] = await connection.query(`
      SELECT * FROM presupuesto_prestaciones_tarifario WHERE idPresupuestos = 553
    `);
    console.table(tarifario);

    console.log('\n=== EQUIPAMIENTOS ===\n');
    const [equipamientos] = await connection.query(`
      SELECT * FROM presupuesto_equipamiento WHERE idPresupuestos = 553
    `);
    console.table(equipamientos);

    console.log('\n=== RESUMEN ===');
    console.log(`Insumos: ${insumos.length} items`);
    console.log(`Prestaciones convenio: ${prestaciones.length} items`);
    console.log(`Prestaciones tarifario: ${tarifario.length} items`);
    console.log(`Equipamientos: ${equipamientos.length} items`);

  } finally {
    await connection.end();
  }
}

checkPresupuesto().catch(console.error);
