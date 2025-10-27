const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function hashPasswords() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'PRUEBAS',
    password: 'Medihome2006',
    database: 'mh_1'
  });

  try {
    // Hash para admin
    const adminHash = await bcrypt.hash('admin123', 10);
    await connection.execute(
      'UPDATE usuarios SET password = ? WHERE username = ?',
      [adminHash, 'admin']
    );

    // Hash para prueba (no pruebas)
    const userHash = await bcrypt.hash('user123', 10);
    await connection.execute(
      'UPDATE usuarios SET password = ? WHERE username = ?',
      [userHash, 'prueba']
    );

    console.log('Contraseñas hasheadas correctamente');
    console.log('admin: admin123');
    console.log('prueba: user123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

hashPasswords();