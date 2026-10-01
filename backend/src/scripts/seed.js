const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'pos_coffee';

const path = require('path');
const fs = require('fs');
const https = require('https');

const backendPort = process.env.PORT || 5000;
const backendBase = process.env.BASE_URL || `http://localhost:${backendPort}`;
const uploadsDir = path.join(__dirname, '../../public/uploads');

function downloadImageIfMissing(filename, sourceUrl) {
  return new Promise((resolve) => {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const dest = path.join(uploadsDir, filename);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      return resolve();
    }
    const file = fs.createWriteStream(dest);
    https.get(sourceUrl, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (redirectRes) => {
          redirectRes.pipe(file);
          file.on('finish', () => { file.close(); resolve(); });
        }).on('error', () => { fs.unlink(dest, () => {}); resolve(); });
      } else {
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }
    }).on('error', () => {
      fs.unlink(dest, () => {});
      resolve();
    });
  });
}

async function seed() {
  console.log('[Seed] Memulai pengisian data awal (seeder)...');
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword,
      database: dbName
    });

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    console.log('[Seed] Menambahkan users...');
    const kasirPasswordHash = await bcrypt.hash('kasir123', 10);
    const ownerPasswordHash = await bcrypt.hash('owner123', 10);

    const usersData = [
      ['Budi Kasir', 'kasir', kasirPasswordHash, 'admin'],
      ['Ibu Sari', 'owner', ownerPasswordHash, 'owner']
    ];

    for (const [name, username, password, role] of usersData) {
      await connection.query(`
        INSERT INTO users (name, username, password, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), role = VALUES(role), updated_at = NOW();
      `, [name, username, password, role]);
    }
    console.log('[Seed] Users berhasil di-seed (kasir / kasir123, owner / owner123).');

    console.log('[Seed] Menyiapkan gambar produk di backend...');
    const productsMaster = [
      { name: 'Espresso', category: 'Kopi', price: 15000, stock: 50, file: 'product-espresso.jpg', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&q=80' },
      { name: 'Americano', category: 'Kopi', price: 18000, stock: 50, file: 'product-americano.jpg', url: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500&q=80' },
      { name: 'Cafe Latte', category: 'Kopi', price: 25000, stock: 40, file: 'product-cafe-latte.jpg', url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&q=80' },
      { name: 'Cappuccino', category: 'Kopi', price: 25000, stock: 40, file: 'product-cappuccino.jpg', url: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&q=80' },
      { name: 'Kopi Susu Gula Aren', category: 'Kopi', price: 22000, stock: 60, file: 'product-kopi-susu.jpg', url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&q=80' },
      { name: 'Vanilla Latte', category: 'Kopi', price: 26000, stock: 35, file: 'product-vanilla-latte.jpg', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80' },
      { name: 'Matcha Latte', category: 'Non-Kopi', price: 27000, stock: 30, file: 'product-matcha-latte.jpg', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&q=80' },
      { name: 'Chocolate', category: 'Non-Kopi', price: 24000, stock: 30, file: 'product-chocolate.jpg', url: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=500&q=80' },
      { name: 'Croissant', category: 'Makanan', price: 20000, stock: 15, file: 'product-croissant.jpg', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&q=80' },
      { name: 'Roti Bakar Coklat', category: 'Makanan', price: 18000, stock: 5, file: 'product-roti-bakar.jpg', url: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?w=500&q=80' },
      { name: 'Kentang Goreng', category: 'Makanan', price: 17000, stock: 0, file: 'product-french-fries.jpg', url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500&q=80' },
      { name: 'Singkong Goreng Keju', category: 'Makanan', price: 16000, stock: 20, file: 'product-singkong-keju.jpg', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80' }
    ];

    for (const item of productsMaster) {
      await downloadImageIfMissing(item.file, item.url);
      const imageUrl = `${backendBase}/uploads/${item.file}`;

      await connection.query(`
        INSERT INTO products (name, category, price, stock, image_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
          category = VALUES(category), 
          price = VALUES(price), 
          stock = VALUES(stock), 
          image_url = VALUES(image_url), 
          updated_at = NOW();
      `, [item.name, item.category, item.price, item.stock, imageUrl]);
    }
    console.log(`[Seed] ${productsMaster.length} Produk berhasil di-seed dengan gambar backend.`);

    const [existingOrders] = await connection.query('SELECT COUNT(*) as count FROM orders');
    console.log(`[Seed] Jumlah order saat ini: ${existingOrders[0].count}`);

    if (existingOrders[0].count < 10) {
      console.log('[Seed] Menyiapkan 10 transaksi order contoh...');

      const [kasirUsers] = await connection.query("SELECT id FROM users WHERE username = 'kasir' LIMIT 1");
      const kasirId = kasirUsers[0]?.id || 1;

      const [products] = await connection.query("SELECT id, name, price FROM products");
      const pMap = {};
      products.forEach(p => { pMap[p.name] = p; });

      const sampleOrders = [
        {
          payment: 'Tunai',
          paid: 50000,
          items: [
            { p: pMap['Espresso'], qty: 2 },
            { p: pMap['Croissant'], qty: 1 }
          ]
        },
        {
          payment: 'QRIS',
          paid: null,
          items: [
            { p: pMap['Cafe Latte'], qty: 1 },
            { p: pMap['Matcha Latte'], qty: 1 }
          ]
        },
        {
          payment: 'Tunai',
          paid: 50000,
          items: [
            { p: pMap['Kopi Susu Gula Aren'], qty: 1 },
            { p: pMap['Roti Bakar Coklat'], qty: 1 }
          ]
        },
        {
          payment: 'QRIS',
          paid: null,
          items: [
            { p: pMap['Americano'], qty: 2 }
          ]
        },
        {
          payment: 'Tunai',
          paid: 100000,
          items: [
            { p: pMap['Cappuccino'], qty: 2 },
            { p: pMap['Croissant'], qty: 2 }
          ]
        },
        {
          payment: 'Tunai',
          paid: 30000,
          items: [
            { p: pMap['Chocolate'], qty: 1 }
          ]
        },
        {
          payment: 'QRIS',
          paid: null,
          items: [
            { p: pMap['Vanilla Latte'] || pMap['Cafe Latte'], qty: 1 },
            { p: pMap['Singkong Goreng Keju'] || pMap['Croissant'], qty: 1 }
          ]
        },
        {
          payment: 'Tunai',
          paid: 50000,
          items: [
            { p: pMap['Kopi Susu Gula Aren'], qty: 2 }
          ]
        },
        {
          payment: 'QRIS',
          paid: null,
          items: [
            { p: pMap['Espresso'], qty: 1 },
            { p: pMap['Americano'], qty: 1 }
          ]
        },
        {
          payment: 'Tunai',
          paid: 100000,
          items: [
            { p: pMap['Matcha Latte'], qty: 2 },
            { p: pMap['Croissant'], qty: 1 }
          ]
        }
      ];

      for (let i = 0; i < sampleOrders.length; i++) {
        const orderData = sampleOrders[i];
        let total = 0;
        const validItems = [];

        for (const item of orderData.items) {
          if (item.p) {
            const subtotal = item.p.price * item.qty;
            total += subtotal;
            validItems.push({
              product_id: item.p.id,
              price: item.p.price,
              qty: item.qty,
              subtotal
            });
          }
        }

        const amountPaid = orderData.payment === 'QRIS' ? total : (orderData.paid || total);
        const changeAmount = orderData.payment === 'QRIS' ? 0 : Math.max(0, amountPaid - total);

        const [orderRes] = await connection.query(`
          INSERT INTO orders (user_id, total_price, payment_method, amount_paid, change_amount, created_at)
          VALUES (?, ?, ?, ?, ?, NOW() - INTERVAL ? MINUTE)
        `, [kasirId, total, orderData.payment, amountPaid, changeAmount, (10 - i) * 15]);

        const orderId = orderRes.insertId;

        for (const item of validItems) {
          await connection.query(`
            INSERT INTO order_details (order_id, product_id, price, qty, subtotal)
            VALUES (?, ?, ?, ?, ?)
          `, [orderId, item.product_id, item.price, item.qty, item.subtotal]);
        }
      }

      console.log('[Seed] 10 Transaksi order contoh berhasil disimpan.');
    }

    console.log('[Seed] Proses seeding berhasil diselesaikan!');
  } catch (error) {
    console.error('[Seed Error] Gagal melakukan seeding:', error.message);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) {
  seed().catch(() => process.exit(1));
}

module.exports = seed;
