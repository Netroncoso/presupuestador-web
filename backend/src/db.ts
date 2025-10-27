import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'PRUEBAS',
  password: process.env.DB_PASSWORD || 'Medihome2006',
  database: process.env.DB_NAME || 'mh_1',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err instanceof Error ? err.message : 'Unknown error');
    console.error('Connection details:', {
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'PRUEBAS',
      database: process.env.DB_NAME || 'mh_1'
    });
    process.exit(1);
  });
