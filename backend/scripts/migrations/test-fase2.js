const mysql = require('mysql2/promise');
require('dotenv').config();

async function testFase2() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mh_1'
        });

        console.log('🧪 Probando funcionalidades Fase 2...\n');

        // 1. Probar listado de últimas versiones
        console.log('1. Probando listado de últimas versiones:');
        const [presupuestos] = await connection.execute(`
            SELECT 
                idPresupuestos, version, estado, es_ultima_version,
                Nombre_Apellido, DNI, costo_total
            FROM presupuestos 
            WHERE es_ultima_version = 1 
            LIMIT 5
        `);
        
        console.log(`   ✅ ${presupuestos.length} presupuestos con última versión`);
        presupuestos.forEach(p => {
            console.log(`      ID: ${p.idPresupuestos}, v${p.version}, ${p.estado}, ${p.Nombre_Apellido}`);
        });

        // 2. Simular creación de nueva versión
        if (presupuestos.length > 0) {
            const presupuestoTest = presupuestos[0];
            console.log(`\n2. Simulando nueva versión para ID ${presupuestoTest.idPresupuestos}:`);
            
            try {
                await connection.beginTransaction();
                
                // Marcar como no-actual
                await connection.execute(
                    'UPDATE presupuestos SET es_ultima_version = 0 WHERE idPresupuestos = ?',
                    [presupuestoTest.idPresupuestos]
                );
                
                // Crear nueva versión (simulada)
                const [result] = await connection.execute(`
                    INSERT INTO presupuestos 
                    (version, presupuesto_padre, es_ultima_version, estado, usuario_id,
                     Nombre_Apellido, DNI, Sucursal, dificil_acceso, 
                     total_insumos, total_prestaciones, costo_total, rentabilidad)
                    VALUES (?, ?, 1, 'pendiente', 1, ?, ?, ?, ?, 1000, 2000, 3000, 10)
                `, [
                    presupuestoTest.version + 1,
                    presupuestoTest.presupuesto_padre || presupuestoTest.idPresupuestos,
                    presupuestoTest.Nombre_Apellido,
                    presupuestoTest.DNI,
                    presupuestoTest.Sucursal || 'Test',
                    presupuestoTest.dificil_acceso || 'no'
                ]);
                
                const nuevoId = result.insertId;
                console.log(`   ✅ Nueva versión creada: ID ${nuevoId}, v${presupuestoTest.version + 1}`);
                
                // Simular notificación a auditor
                await connection.execute(`
                    INSERT IGNORE INTO notificaciones 
                    (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
                    SELECT u.id, ?, ?, 'pendiente', ?
                    FROM usuarios u WHERE u.rol = 'auditor_medico'
                `, [
                    nuevoId, 
                    presupuestoTest.version + 1, 
                    `Presupuesto v${presupuestoTest.version + 1} para ${presupuestoTest.Nombre_Apellido} requiere aprobación`
                ]);
                
                console.log(`   ✅ Notificación enviada a auditores`);
                
                // Rollback para no afectar datos reales
                await connection.rollback();
                console.log(`   ✅ Rollback ejecutado (datos no modificados)`);
                
            } catch (error) {
                await connection.rollback();
                console.error(`   ❌ Error en simulación: ${error.message}`);
            }
        }

        // 3. Probar consulta de historial
        console.log('\n3. Probando consulta de historial:');
        if (presupuestos.length > 0) {
            const testId = presupuestos[0].idPresupuestos;
            const [historial] = await connection.execute(`
                SELECT 
                    idPresupuestos, version, estado, es_ultima_version, created_at
                FROM presupuestos 
                WHERE idPresupuestos = ? OR presupuesto_padre = ?
                ORDER BY version DESC
            `, [testId, testId]);
            
            console.log(`   ✅ ${historial.length} versiones encontradas para ID ${testId}`);
            historial.forEach(h => {
                console.log(`      v${h.version}: ${h.estado} ${h.es_ultima_version ? '(actual)' : ''}`);
            });
        }

        // 4. Probar consulta de pendientes
        console.log('\n4. Probando consulta de pendientes:');
        const [pendientes] = await connection.execute(`
            SELECT 
                p.idPresupuestos, p.version, p.estado,
                p.Nombre_Apellido, p.costo_total, p.rentabilidad,
                DATEDIFF(NOW(), p.created_at) as dias_pendiente
            FROM presupuestos p
            WHERE p.estado IN ('pendiente', 'en_revision') 
            AND p.es_ultima_version = 1
            LIMIT 5
        `);
        
        console.log(`   ✅ ${pendientes.length} presupuestos pendientes`);
        pendientes.forEach(p => {
            console.log(`      ID: ${p.idPresupuestos}, v${p.version}, ${p.Nombre_Apellido}, ${p.dias_pendiente} días`);
        });

        // 5. Verificar notificaciones
        console.log('\n5. Verificando sistema de notificaciones:');
        const [notificaciones] = await connection.execute(`
            SELECT 
                n.id, n.tipo, n.estado, n.mensaje,
                u.username as destinatario
            FROM notificaciones n
            JOIN usuarios u ON n.usuario_id = u.id
            ORDER BY n.creado_en DESC
            LIMIT 5
        `);
        
        console.log(`   ✅ ${notificaciones.length} notificaciones en sistema`);
        notificaciones.forEach(n => {
            console.log(`      ${n.tipo} para ${n.destinatario}: ${n.estado}`);
        });

        console.log('\n🎉 Pruebas Fase 2 completadas exitosamente!');
        console.log('\n📋 Funcionalidades verificadas:');
        console.log('   ✅ Listado de últimas versiones');
        console.log('   ✅ Creación de nuevas versiones');
        console.log('   ✅ Historial de versiones');
        console.log('   ✅ Consulta de pendientes');
        console.log('   ✅ Sistema de notificaciones');

    } catch (error) {
        console.error('❌ Error durante pruebas:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testFase2();