import { pool } from '../src/db';

async function test() {
  try {
    const [rows] = await pool.query('SELECT 1 as ok');
    console.log('DB connected, result:', rows);
    process.exit(0);
  } catch (err) {
    console.error('DB connection error:', err instanceof Error ? err.message : String(err));
    console.error('Stack trace:', err instanceof Error ? err.stack : 'No stack trace available');
    process.exit(1);
  }
}

test();
