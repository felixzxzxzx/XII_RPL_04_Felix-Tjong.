const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pos_coffee',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Terhubung ke MySQL di ${process.env.DB_HOST || '127.0.0.1'}:${process.env.DB_PORT || '3306'} (DB: ${process.env.DB_NAME || 'pos_coffee'})`);
    connection.release();
    return true;
  } catch (error) {
    console.error('[Database Error] Gagal terhubung ke MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
