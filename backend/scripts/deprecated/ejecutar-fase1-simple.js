const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function ejecutarFase1Simple() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mh_1'
        });

        console.log('🚀 Ejecutando Fase 1 (versión simple)...\n');

        // Leer migración simple
        const migrationPath = path.join(__dirname, '..', 'migrations', 'fase1_simple.sql');
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');

        // Dividir en statements individuales
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📋 Ejecutando ${statements.length} statements...\n`);

        let success = 0;
        let skipped = 0;
        let errors = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await connection.execute(statement);
                console.log(`✅ ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
                success++;
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME' || 
                    error.code === 'ER_TABLE_EXISTS_ERROR' ||
                    error.code === 'ER_DUP_KEYNAME' ||
                    error.message.includes('Duplicate')) {
                    console.log(`⏭️  ${i + 1}/${statements.length}: Ya existe - ${statement.substring(0, 50)}...`);
                    skipped++;
                } else {
                    console.error(`❌ ${i + 1}/${statements.length}: Error - ${statement.substring(0, 50)}...`);
                    console.error(`   ${error.message}`);
                    errors++;
                }
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Exitosos: ${success}`);
        console.log(`   ⏭️  Saltados: ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);

        if (errors === 0) {
            console.log('\n🎉 ¡Migración completada exitosamente!');
        } else {
            console.log('\n⚠️  Migración completada con algunos errores');
        }

    } catch (error) {
        console.error('❌ Error general:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

ejecutarFase1Simple();