const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('----------------------------------------------------');
  console.log('   POS Web Coffee Shop UMKM - Express.js Backend    ');
  console.log('----------------------------------------------------');

  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn('[Peringatan] Pastikan service MySQL berjalan dan konfigurasi .env sudah sesuai.');
    console.warn('[Tips] Anda dapat menjalankan "npm run db:init" setelah MySQL siap.');
  }

  app.listen(PORT, () => {
    console.log(`[Server] Berjalan di http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('----------------------------------------------------');
  });
}

startServer();
