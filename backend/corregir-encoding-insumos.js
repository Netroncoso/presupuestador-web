const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: '127.0.0.1',
  user: 'PRUEBAS',
  password: 'Medihome2006',
  database: 'mh_1'
};

const REPLACEMENTS = {
  'ALGODN': 'ALGODÓN',
  'APSITO': 'APÓSITO',
  'BAO': 'BAÑO',
  'BALN': 'BALÓN',
  'ASPIRACIN': 'ASPIRACIÓN',
  'PEDITRICO': 'PEDIÁTRICO',
  'HIPOALERGNICA': 'HIPOALÉRGICA',
  'OLEO CALCREO': 'ÓLEO CALCÁREO',
  'PAAL': 'PAÑAL',
  'PAALES': 'PAÑALES',
  'ANATMICO': 'ANATÓMICO',
  'PAO': 'PAÑO',
  'SOLUCIN': 'SOLUCIÓN',
  'FISIOLGICA': 'FISIOLÓGICA',
  'NASOGSTRICA': 'NASOGÁSTRICA',
  'ESTRIL': 'ESTÉRIL',
  'EMULSIN': 'EMULSIÓN',
  'BISTUR': 'BISTURÍ',
  'TRAQUEOSTOMA': 'TRAQUEOSTOMÍA',
  'TRAQUEOTOMA': 'TRAQUEOTOMÍA',
  'Catter': 'Catéter',
  'CATETER': 'CATÉTER',
  'PAALES': 'PAÑALES',
  'ALGODN': 'ALGODÓN',
  'Extensin': 'Extensión',
  'gua': 'guía',
  'fijacin': 'fijación',
  'SUCCIN': 'SUCCIÓN',
  'INHALACIN': 'INHALACIÓN',
  'OXGENO': 'OXÍGENO',
  'aspiracin': 'aspiración',
  'Vlvula': 'Válvula',
  'fisiolgico': 'fisiológico',
  'ENDOCRANEAL': 'ENDOTRAQUEAL',
  'BALN': 'BALÓN',
  'ortopdica': 'ortopédica',
  'plstico': 'plástico',
  'elsticas': 'elásticas',
  'gstrico': 'gástrico',
  'Kinesiolgica': 'Kinesiológica',
  'lquido': 'líquido',
  'rgida': 'rígida',
  'semirgida': 'semirígida',
  'ltex': 'látex',
  'PORTTIL': 'PORTÁTIL'
};

async function corregirEncoding() {
  const connection = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('Conectado a la base de datos\n');
    
    let totalCorregidos = 0;
    
    for (const [mal, bien] of Object.entries(REPLACEMENTS)) {
      const [result] = await connection.query(
        `UPDATE insumos SET producto = REPLACE(producto, ?, ?) WHERE producto LIKE ?`,
        [mal, bien, `%${mal}%`]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✓ ${mal} → ${bien} (${result.affectedRows} registros)`);
        totalCorregidos += result.affectedRows;
      }
    }
    
    console.log(`\n=== RESUMEN ===`);
    console.log(`Total corregidos: ${totalCorregidos} registros`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
    console.log('\nConexión cerrada');
  }
}

corregirEncoding();
