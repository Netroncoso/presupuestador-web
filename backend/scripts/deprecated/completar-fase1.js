const mysql = require('mysql2/promise');
require('dotenv').config();

async function completarFase1() {
    let connection;
    
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'mh_1'
        });

        console.log('🔧 Completando migración Fase 1...\n');

        const statements = [
            // Agregar columna version si no existe
            "ALTER TABLE presupuestos ADD COLUMN version INT DEFAULT 1",
            
            // Agregar foreign key si no existe
            "ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuestos_padre FOREIGN KEY (presupuesto_padre) REFERENCES presupuestos(idPresupuestos)",
            
            // Modificar usuarios para agregar rol auditor
            "ALTER TABLE usuarios MODIFY COLUMN rol ENUM('admin','user','auditor_medico') DEFAULT 'user'",
            
            // Crear tabla notificaciones
            `CREATE TABLE notificaciones (
                id INT PRIMARY KEY AUTO_INCREMENT,
                usuario_id INT NOT NULL,
                presupuesto_id INT NOT NULL,
                version_presupuesto INT DEFAULT 1,
                tipo ENUM('pendiente','aprobado','rechazado','nueva_version') DEFAULT 'pendiente',
                mensaje VARCHAR(512),
                estado ENUM('nuevo','leido') DEFAULT 'nuevo',
                creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE
            )`,
            
            // Crear tabla auditorías
            `CREATE TABLE auditorias_presupuestos (
                id INT PRIMARY KEY AUTO_INCREMENT,
                presupuesto_id INT NOT NULL,
                version_presupuesto INT NOT NULL,
                auditor_id INT NOT NULL,
                estado_anterior VARCHAR(50),
                estado_nuevo VARCHAR(50),
                comentario TEXT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (presupuesto_id) REFERENCES presupuestos(idPresupuestos) ON DELETE CASCADE,
                FOREIGN KEY (auditor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            
            // Crear índices para notificaciones
            "CREATE INDEX idx_usuario_estado ON notificaciones(usuario_id, estado, creado_en)",
            "CREATE INDEX idx_presupuesto_version ON notificaciones(presupuesto_id, version_presupuesto)",
            
            // Crear índices para auditorías
            "CREATE INDEX idx_auditoria_presupuesto ON auditorias_presupuestos(presupuesto_id, version_presupuesto)",
            "CREATE INDEX idx_auditoria_auditor ON auditorias_presupuestos(auditor_id, fecha)",
            
            // Migrar datos existentes
            "UPDATE presupuestos SET version = 1, es_ultima_version = 1, estado = 'aprobado' WHERE version IS NULL",
            
            // Crear usuario auditor
            "INSERT IGNORE INTO usuarios (username, password, rol, activo) VALUES ('auditor', '$2b$10$ejemplo_hash_seguro', 'auditor_medico', 1)"
        ];

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            try {
                await connection.execute(statement);
                console.log(`✅ ${i + 1}/${statements.length}: Ejecutado correctamente`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME' || 
                    error.code === 'ER_TABLE_EXISTS_ERROR' ||
                    error.code === 'ER_DUP_KEYNAME' ||
                    error.message.includes('Duplicate')) {
                    console.log(`⏭️  ${i + 1}/${statements.length}: Ya existe`);
                } else {
                    console.error(`❌ ${i + 1}/${statements.length}: ${error.message}`);
                }
            }
        }

        console.log('\n🎉 Completado!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

completarFase1();