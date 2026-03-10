require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDuplicates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [rows] = await connection.query(`
      SELECT 
        fsv.id,
        fsv.financiador_servicio_id,
        fsv.zona_id,
        tz.nombre as zona_nombre,
        fsv.precio_facturar,
        fsv.fecha_inicio,
        fsv.fecha_fin,
        fs.financiador_id,
        fs.servicio_id,
        s.nombre as servicio_nombre
      FROM financiador_servicio_valores fsv
      LEFT JOIN financiador_servicio fs ON fsv.financiador_servicio_id = fs.id
      LEFT JOIN tarifario_zonas tz ON fsv.zona_id = tz.id
      LEFT JOIN servicios s ON fs.servicio_id = s.id
      WHERE fs.financiador_id = 5
      ORDER BY s.nombre, tz.nombre, fsv.fecha_inicio DESC
    `);

    console.log('\n=== VALORES PARA FINANCIADOR 5 (ACA Salud) ===\n');
    console.table(rows);

    // Buscar duplicados vigentes (fecha_fin IS NULL)
    const [duplicates] = await connection.query(`
      SELECT 
        fs.servicio_id,
        s.nombre as servicio,
        fsv.zona_id,
        tz.nombre as zona,
        COUNT(*) as count_vigentes,
        GROUP_CONCAT(fsv.precio_facturar) as precios,
        GROUP_CONCAT(fsv.fecha_inicio) as fechas
      FROM financiador_servicio_valores fsv
      JOIN financiador_servicio fs ON fsv.financiador_servicio_id = fs.id
      LEFT JOIN tarifario_zonas tz ON fsv.zona_id = tz.id
      LEFT JOIN servicios s ON fs.servicio_id = s.id
      WHERE fs.financiador_id = 5 AND fsv.fecha_fin IS NULL
      GROUP BY fs.servicio_id, fsv.zona_id
      HAVING COUNT(*) > 1
    `);

    console.log('\n=== DUPLICADOS VIGENTES ===\n');
    console.table(duplicates);

  } finally {
    await connection.end();
  }
}

checkDuplicates().catch(console.error);
