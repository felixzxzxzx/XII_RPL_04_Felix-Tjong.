const migrate = require('./migrate');
const seed = require('./seed');

async function initDb() {
  try {
    console.log('=== INISIALISASI DATABASE POS COFFEE ===');
    await migrate();
    await seed();
    console.log('=== DATABASE SIAP DIGUNAKAN ===');
  } catch (error) {
    console.error('Inisialisasi database gagal:', error.message);
    process.exit(1);
  }
}

initDb();
