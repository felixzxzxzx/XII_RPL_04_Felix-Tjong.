const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'pos_coffee';

async function migrate() {
  console.log(`[Migrate] Memulai migrasi database '${dbName}'...`);
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`[Migrate] Database '${dbName}' siap.`);

    await connection.query(`USE \`${dbName}\`;`);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        username    VARCHAR(50)  NOT NULL UNIQUE,
        password    VARCHAR(255) NOT NULL,
        role        ENUM('admin','owner') NOT NULL DEFAULT 'admin',
        created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migrate] Tabel `users` siap.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100) NOT NULL UNIQUE,
        category    VARCHAR(30)  NOT NULL DEFAULT 'Kopi',
        price       INT UNSIGNED NOT NULL CHECK (price > 0),
        stock       INT UNSIGNED NOT NULL DEFAULT 0 CHECK (stock >= 0),
        image_url   VARCHAR(500) NULL,
        created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migrate] Tabel `products` siap.');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id        BIGINT UNSIGNED NOT NULL,
        total_price    INT UNSIGNED NOT NULL CHECK (total_price > 0),
        payment_method ENUM('Tunai','QRIS') NOT NULL,
        amount_paid    INT UNSIGNED NOT NULL,
        change_amount  INT UNSIGNED NOT NULL DEFAULT 0,
        created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT chk_paid CHECK (amount_paid >= total_price)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migrate] Tabel `orders` siap.');

    try {
      await connection.query(`CREATE INDEX idx_orders_created ON orders(created_at);`);
      console.log('[Migrate] Index `idx_orders_created` dibuat.');
    } catch (idxErr) {
      if (!idxErr.message.includes('Duplicate key name')) {
        console.warn('[Migrate] Catatan index:', idxErr.message);
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS order_details (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        order_id    BIGINT UNSIGNED NOT NULL,
        product_id  BIGINT UNSIGNED NOT NULL,
        price       INT UNSIGNED NOT NULL,
        qty         INT UNSIGNED NOT NULL CHECK (qty > 0),
        subtotal    INT UNSIGNED NOT NULL,
        CONSTRAINT fk_od_order FOREIGN KEY (order_id) REFERENCES orders(id)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_od_product FOREIGN KEY (product_id) REFERENCES products(id)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migrate] Tabel `order_details` siap.');

    console.log('[Migrate] Migrasi selesai dengan sukses!');
  } catch (error) {
    console.error('[Migrate Error] Gagal menjalankan migrasi:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  migrate().catch(() => process.exit(1));
}

module.exports = migrate;
