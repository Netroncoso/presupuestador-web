const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'PRUEBAS',
  password: 'Medihome2006',
  database: 'mh_1'
};

async function migrarInsumosCostos() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('Conectado a la base de datos');
    
    // 1. Deshabilitar foreign key checks
    console.log('\n1. Deshabilitando foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 2. Eliminar insumos sin codigo_producto
    console.log('\n2. Eliminando insumos sin codigo_producto...');
    const [deleteResult] = await connection.query(
      'DELETE FROM insumos WHERE codigo_producto IS NULL OR codigo_producto = ""'
    );
    console.log(`   Eliminados: ${deleteResult.affectedRows} insumos`);
    
    // 3. Leer CSV
    console.log('\n3. Leyendo CSV...');
    const csvPath = path.join(__dirname, '..', 'Insumos-costos.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Saltar header
    const dataLines = lines.slice(1);
    console.log(`   Total registros en CSV: ${dataLines.length}`);
    
    // 4. Procesar cada línea
    console.log('\n4. Procesando registros...');
    let actualizados = 0;
    let insertados = 0;
    let errores = 0;
    
    for (const line of dataLines) {
      try {
        // Parsear CSV (separado por ;)
        const parts = line.split(';');
        if (parts.length < 4) continue;
        
        const codigoProducto = parts[0].trim().replace(/\r/g, '');
        let producto = parts[1].trim().replace(/\r/g, '');
        const costoStr = parts[2].trim().replace(/\r/g, '').replace(/\./g, '').replace(',', '.');
        const fechaStr = parts[3].trim().replace(/\r/g, '');
        
        if (!codigoProducto || !producto) continue;
        
        // Convertir a minúsculas con primera letra mayúscula
        producto = producto.toLowerCase().replace(/^\w/, c => c.toUpperCase());
        
        // Convertir costo
        const costo = parseFloat(costoStr) || 0;
        
        // Convertir fecha DD/MM/YYYY a YYYY-MM-DD
        let fechaActualizacion = null;
        if (fechaStr) {
          const [dia, mes, anio] = fechaStr.split('/');
          if (dia && mes && anio) {
            fechaActualizacion = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
          }
        }
        
        // Buscar si existe por codigo_producto
        const [existing] = await connection.query(
          'SELECT idInsumos FROM insumos WHERE UPPER(TRIM(codigo_producto)) = ?',
          [codigoProducto.toUpperCase()]
        );
        
        if (existing.length > 0) {
          // Actualizar
          await connection.query(
            `UPDATE insumos 
             SET producto = ?, 
                 costo = ?,
                 fecha_actualizacion = ?
             WHERE idInsumos = ?`,
            [producto, costo, fechaActualizacion, existing[0].idInsumos]
          );
          actualizados++;
        } else {
          // Insertar
          await connection.query(
            `INSERT INTO insumos (codigo_producto, producto, costo, fecha_actualizacion)
             VALUES (?, ?, ?, ?)`,
            [codigoProducto, producto, costo, fechaActualizacion]
          );
          insertados++;
        }
        
      } catch (err) {
        console.error(`   Error en línea: ${line.substring(0, 50)}...`);
        console.error(`   ${err.message}`);
        errores++;
      }
    }
    
    // 5. Rehabilitar foreign key checks
    console.log('\n5. Rehabilitando foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n=== RESUMEN ===');
    console.log(`Actualizados: ${actualizados}`);
    console.log(`Insertados: ${insertados}`);
    console.log(`Errores: ${errores}`);
    console.log(`Total procesados: ${actualizados + insertados}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
    console.log('\nConexión cerrada');
  }
}

migrarInsumosCostos();
