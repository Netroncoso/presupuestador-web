require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanDuplicates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    await connection.beginTransaction();

    // Para cada combinación de financiador_servicio_id + zona_id con duplicados vigentes
    const [duplicates] = await connection.query(`
      SELECT 
        financiador_servicio_id,
        zona_id,
        COUNT(*) as count_vigentes,
        MAX(id) as id_mas_reciente
      FROM financiador_servicio_valores
      WHERE fecha_fin IS NULL
      GROUP BY financiador_servicio_id, zona_id
      HAVING COUNT(*) > 1
    `);

    console.log(`\nEncontrados ${duplicates.length} grupos con duplicados vigentes\n`);

    for (const dup of duplicates) {
      console.log(`Limpiando financiador_servicio_id=${dup.financiador_servicio_id}, zona_id=${dup.zona_id}`);
      console.log(`  Manteniendo ID ${dup.id_mas_reciente}, cerrando los demás...`);

      // Cerrar todos los vigentes EXCEPTO el más reciente
      const [result] = await connection.query(`
        UPDATE financiador_servicio_valores
        SET fecha_fin = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        WHERE financiador_servicio_id = ?
          AND zona_id = ?
          AND fecha_fin IS NULL
          AND id != ?
      `, [dup.financiador_servicio_id, dup.zona_id, dup.id_mas_reciente]);

      console.log(`  ✓ ${result.affectedRows} registros cerrados\n`);
    }

    await connection.commit();
    console.log('✅ Limpieza completada exitosamente');

  } catch (error) {
    await connection.rollback();
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

cleanDuplicates().catch(console.error);
