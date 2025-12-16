const mysql = require('mysql2/promise');
require('dotenv').config();

async function verificarFase1() {
    let connection;
    
    try {
        // Conectar a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mh_1'
        });

        console.log('🔍 Verificando migración Fase 1...\n');

        // 1. Verificar columnas agregadas a presupuestos
        console.log('1. Verificando tabla presupuestos:');
        const [presupuestosColumns] = await connection.execute(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'presupuestos'
            AND COLUMN_NAME IN ('version', 'presupuesto_padre', 'es_ultima_version', 'estado')
            ORDER BY COLUMN_NAME
        `);
        
        const expectedColumns = ['version', 'presupuesto_padre', 'es_ultima_version', 'estado'];
        const foundColumns = presupuestosColumns.map(col => col.COLUMN_NAME);
        
        expectedColumns.forEach(col => {
            if (foundColumns.includes(col)) {
                console.log(`   ✅ Columna '${col}' agregada correctamente`);
            } else {
                console.log(`   ❌ Columna '${col}' NO encontrada`);
            }
        });

        // 2. Verificar datos migrados
        console.log('\n2. Verificando datos migrados:');
        const [presupuestosData] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN version IS NOT NULL THEN 1 END) as con_version,
                COUNT(CASE WHEN estado IS NOT NULL THEN 1 END) as con_estado,
                COUNT(CASE WHEN es_ultima_version = 1 THEN 1 END) as ultima_version
            FROM presupuestos
        `);
        
        const data = presupuestosData[0];
        console.log(`   📊 Total presupuestos: ${data.total}`);
        console.log(`   📊 Con versión: ${data.con_version}`);
        console.log(`   📊 Con estado: ${data.con_estado}`);
        console.log(`   📊 Marcados como última versión: ${data.ultima_version}`);

        // 3. Verificar rol auditor en usuarios
        console.log('\n3. Verificando tabla usuarios:');
        const [rolesData] = await connection.execute(`
            SELECT rol, COUNT(*) as cantidad 
            FROM usuarios 
            GROUP BY rol
        `);
        
        console.log('   Roles disponibles:');
        rolesData.forEach(role => {
            console.log(`   📋 ${role.rol}: ${role.cantidad} usuario(s)`);
        });

        // 4. Verificar tablas nuevas
        console.log('\n4. Verificando tablas nuevas:');
        const [tablesData] = await connection.execute(`
            SELECT TABLE_NAME, TABLE_ROWS
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('notificaciones', 'auditorias_presupuestos')
        `);
        
        const expectedTables = ['notificaciones', 'auditorias_presupuestos'];
        const foundTables = tablesData.map(table => table.TABLE_NAME);
        
        expectedTables.forEach(table => {
            if (foundTables.includes(table)) {
                const tableInfo = tablesData.find(t => t.TABLE_NAME === table);
                console.log(`   ✅ Tabla '${table}' creada (${tableInfo.TABLE_ROWS || 0} registros)`);
            } else {
                console.log(`   ❌ Tabla '${table}' NO encontrada`);
            }
        });

        // 5. Verificar índices
        console.log('\n5. Verificando índices:');
        const [indexesData] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                INDEX_NAME,
                COLUMN_NAME
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME IN ('presupuestos', 'notificaciones', 'auditorias_presupuestos')
            AND INDEX_NAME LIKE 'idx_%'
            ORDER BY TABLE_NAME, INDEX_NAME
        `);
        
        const indexesByTable = {};
        indexesData.forEach(idx => {
            if (!indexesByTable[idx.TABLE_NAME]) {
                indexesByTable[idx.TABLE_NAME] = [];
            }
            if (!indexesByTable[idx.TABLE_NAME].includes(idx.INDEX_NAME)) {
                indexesByTable[idx.TABLE_NAME].push(idx.INDEX_NAME);
            }
        });
        
        Object.keys(indexesByTable).forEach(table => {
            console.log(`   📋 ${table}:`);
            indexesByTable[table].forEach(index => {
                console.log(`      ✅ ${index}`);
            });
        });

        // 6. Verificar usuario auditor
        console.log('\n6. Verificando usuario auditor:');
        const [auditorData] = await connection.execute(`
            SELECT username, rol, activo 
            FROM usuarios 
            WHERE rol = 'auditor_medico'
        `);
        
        if (auditorData.length > 0) {
            auditorData.forEach(user => {
                console.log(`   ✅ Usuario auditor: ${user.username} (activo: ${user.activo})`);
            });
        } else {
            console.log('   ⚠️  No se encontraron usuarios con rol auditor_medico');
        }

        console.log('\n🎉 Verificación completada!');
        
        // Resumen final
        const allGood = 
            foundColumns.length === expectedColumns.length &&
            foundTables.length === expectedTables.length &&
            data.total === data.con_version &&
            data.total === data.con_estado;
            
        if (allGood) {
            console.log('✅ Migración Fase 1 ejecutada correctamente');
        } else {
            console.log('⚠️  Revisar elementos faltantes arriba');
        }

    } catch (error) {
        console.error('❌ Error durante verificación:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Ejecutar verificación
verificarFase1();