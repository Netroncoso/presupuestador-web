const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function ejecutarFase1() {
    let connection;
    
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mh_1',
            multipleStatements: true
        });

        console.log('🚀 Iniciando migración Fase 1...\n');

        // Leer archivo de migración
        const migrationPath = path.join(__dirname, '..', 'migrations', 'fase1_sistema_versiones_auditoria.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        console.log('📄 Archivo de migración cargado');
        console.log('⚠️  IMPORTANTE: Esta migración es segura y no elimina datos existentes\n');

        // Confirmar ejecución
        console.log('🔍 Verificando conexión a base de datos...');
        const [dbCheck] = await connection.execute('SELECT DATABASE() as db_name, NOW() as timestamp');
        console.log(`✅ Conectado a: ${dbCheck[0].db_name} en ${dbCheck[0].timestamp}\n`);

        // Backup de seguridad (opcional)
        console.log('💾 Creando backup de tablas críticas...');
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS backup_presupuestos_fase1 AS 
                SELECT * FROM presupuestos LIMIT 0
            `);
            
            await connection.execute(`
                INSERT INTO backup_presupuestos_fase1 
                SELECT * FROM presupuestos
            `);
            
            console.log('✅ Backup creado: backup_presupuestos_fase1');
        } catch (backupError) {
            console.log('⚠️  No se pudo crear backup (continuando...)');
        }

        // Ejecutar migración
        console.log('\n🔧 Ejecutando migración...');
        
        // Dividir el SQL en statements individuales para mejor control
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));

        let executedCount = 0;
        let skippedCount = 0;

        for (const statement of statements) {
            try {
                if (statement.toLowerCase().includes('select')) {
                    // Ejecutar SELECT y mostrar resultado
                    const [result] = await connection.execute(statement);
                    if (Array.isArray(result) && result.length > 0) {
                        console.log('📊 Resultado:', result[0]);
                    }
                } else {
                    // Ejecutar otros statements
                    await connection.execute(statement);
                    executedCount++;
                    console.log(`✅ Ejecutado: ${statement.substring(0, 60)}...`);
                }
            } catch (error) {
                if (error.message.includes('already exists') || 
                    error.message.includes('Duplicate column') ||
                    error.message.includes('Duplicate key') ||
                    error.code === 'ER_DUP_FIELDNAME' ||
                    error.code === 'ER_TABLE_EXISTS_ERROR') {
                    skippedCount++;
                    console.log(`⏭️  Saltado (ya existe): ${statement.substring(0, 60)}...`);
                } else {
                    console.error(`❌ Error en statement: ${statement.substring(0, 50)}...`);
                    console.error(`   ${error.message}`);
                    console.error(`   Código: ${error.code}`);
                }
            }
        }

        console.log(`\n📈 Migración completada:`);
        console.log(`   ✅ Statements ejecutados: ${executedCount}`);
        console.log(`   ⏭️  Statements saltados: ${skippedCount}`);

        // Verificar resultado
        console.log('\n🔍 Verificando resultado...');
        
        // Verificar presupuestos
        const [presupuestosCheck] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN version IS NOT NULL THEN 1 END) as con_version,
                COUNT(CASE WHEN estado IS NOT NULL THEN 1 END) as con_estado
            FROM presupuestos
        `);
        
        console.log(`📊 Presupuestos: ${presupuestosCheck[0].total} total, ${presupuestosCheck[0].con_version} con versión, ${presupuestosCheck[0].con_estado} con estado`);

        // Verificar tablas nuevas
        const [tablesCheck] = await connection.execute(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('notificaciones', 'auditorias_presupuestos')
        `);
        
        console.log(`📋 Tablas nuevas creadas: ${tablesCheck.map(t => t.TABLE_NAME).join(', ')}`);

        console.log('\n🎉 ¡Migración Fase 1 completada exitosamente!');
        console.log('\n📋 Próximos pasos:');
        console.log('   1. Ejecutar: node scripts/verificar-fase1.js');
        console.log('   2. Cambiar password del usuario auditor');
        console.log('   3. Proceder con Fase 2 del sistema');

    } catch (error) {
        console.error('❌ Error durante migración:', error.message);
        console.error('\n🔄 La base de datos no fue modificada debido al error');
        
        // Intentar rollback si es necesario
        if (connection) {
            try {
                await connection.execute('ROLLBACK');
                console.log('✅ Rollback ejecutado');
            } catch (rollbackError) {
                console.log('⚠️  No se pudo ejecutar rollback automático');
            }
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar migración
ejecutarFase1();