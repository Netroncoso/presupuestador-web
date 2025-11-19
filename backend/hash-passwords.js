const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function hashPasswords() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('Error: Missing database environment variables');
    process.exit(1);
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
      console.error('Usage: node hash-passwords.js <username> <password>');
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);
    await connection.execute(
      'UPDATE usuarios SET password = ? WHERE username = ?',
      [hash, username]
    );

    console.log(`Password updated successfully for user: ${username}`);
  } catch (error) {
    console.error('Error updating password:', error.message);
  } finally {
    await connection.end();
  }
}

hashPasswords();