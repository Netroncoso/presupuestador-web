const mysql = require('mysql2/promise');

async function checkEndpoints() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'PRUEBAS',
    password: 'Medihome2006',
    database: 'mh_1'
  });

  console.log('\n=== VERIFICACIÓN ENDPOINTS Y NOTIFICACIONES ===\n');

  // 1. Verificar estructura tabla notificaciones
  const [columns] = await connection.execute(`
    DESCRIBE notificaciones
  `);
  console.log('✓ Estructura tabla notificaciones:');
  console.table(columns);

  // 2. Verificar notificaciones recientes
  const [notifs] = await connection.execute(`
    SELECT 
      n.id,
      n.usuario_id,
      u.nombre as usuario,
      u.rol,
      n.tipo,
      n.mensaje,
      n.estado,
      n.presupuesto_id,
      n.creado_en
    FROM notificaciones n
    JOIN usuarios u ON n.usuario_id = u.id
    ORDER BY n.creado_en DESC
    LIMIT 10
  `);
  console.log('\n✓ Últimas 10 notificaciones:');
  console.table(notifs);

  // 3. Verificar auditorías recientes
  const [audits] = await connection.execute(`
    SELECT 
      a.id,
      a.presupuesto_id,
      a.auditor_id,
      u.nombre as auditor,
      u.rol as auditor_rol,
      a.estado_anterior,
      a.estado_nuevo,
      a.comentario,
      a.fecha
    FROM auditorias_presupuestos a
    LEFT JOIN usuarios u ON a.auditor_id = u.id
    ORDER BY a.fecha DESC
    LIMIT 10
  `);
  console.log('\n✓ Últimas 10 auditorías:');
  console.table(audits);

  await connection.end();
}

checkEndpoints().catch(console.error);
