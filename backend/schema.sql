-- Database Schema: POS Web Coffee Shop UMKM
-- MySQL 8.0+ / MariaDB 10.4+, InnoDB, utf8mb4

CREATE DATABASE IF NOT EXISTS pos_coffee CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pos_coffee;

-- 1. Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,              -- bcrypt hash
  role        ENUM('admin','owner') NOT NULL DEFAULT 'admin',
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel Products
CREATE TABLE IF NOT EXISTS products (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  category    VARCHAR(30)  NOT NULL DEFAULT 'Kopi',   -- Kopi, Non-Kopi, Makanan
  price       INT UNSIGNED NOT NULL CHECK (price > 0),
  stock       INT UNSIGNED NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url   VARCHAR(500) NULL,
  created_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabel Orders
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

-- Index pada orders(created_at) untuk performa query omset & filter tanggal
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- 4. Tabel Order Details
CREATE TABLE IF NOT EXISTS order_details (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  price       INT UNSIGNED NOT NULL,              -- snapshot harga saat transaksi
  qty         INT UNSIGNED NOT NULL CHECK (qty > 0),
  subtotal    INT UNSIGNED NOT NULL,              -- price * qty
  CONSTRAINT fk_od_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_od_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
