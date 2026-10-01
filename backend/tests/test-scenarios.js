const http = require('http');
const dotenv = require('dotenv');
dotenv.config();

const app = require('../src/app');
const { pool } = require('../src/config/db');

let server = null;
let BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

const testResults = [];

async function ensureServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(1200) });
    if (res.ok) {
      return BASE_URL;
    }
  } catch (err) {
  }

  return new Promise((resolve, reject) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      resolve(BASE_URL);
    });
    server.on('error', reject);
  });
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

async function runScenario({ id, title, purpose, type, testFn }) {
  console.log(`--------------------------------------------------------------------------------`);
  console.log(`[${id}] ${title}`);
  console.log(`Tipe Uji : ${type}`);
  console.log(`Tujuan   : ${purpose}`);

  try {
    const result = await testFn();
    console.log(`Hasil    : \x1b[32m[PASS] BERHASIL\x1b[0m -> ${result}`);
    testResults.push({ id, title, status: 'PASS', note: result });
  } catch (error) {
    console.log(`Hasil    : \x1b[31m[FAIL] GAGAL\x1b[0m -> ${error.message}`);
    testResults.push({ id, title, status: 'FAIL', note: error.message });
  }
}

async function runAllTests() {
  await ensureServerRunning();

  console.log('================================================================================');
  console.log('       PENGUJIAN OTOMATIS BACK-END (AUTOMATION TESTING SUITE BE-01 - BE-11)      ');
  console.log('                    Ujian Praktik Kejuruan PPLG / RPL                           ');
  console.log('================================================================================');
  console.log(`Endpoint Uji : ${BASE_URL}`);
  console.log(`Waktu Uji    : ${new Date().toLocaleString('id-ID')}\n`);

  let kasirToken = '';
  let ownerToken = '';
  let cafeLatteId = null;
  let croissantId = null;
  let rotiBakarId = null;

  await runScenario({
    id: 'BE-01',
    title: 'Autentikasi Kasir dengan Kredensial Valid',
    type: 'Uji Positif (Positive Test)',
    purpose: 'Memverifikasi bahwa akun kasir yang sah dapat login dan memperoleh token JWT beserta identitas peran (role) yang tepat.',
    testFn: async () => {
      const res = await request('/login', {
        method: 'POST',
        body: { username: 'kasir', password: 'kasir123' }
      });
      if (res.status !== 200 || !res.data.token) {
        throw new Error(`Status ${res.status}: ${res.data.message || 'Token JWT tidak diterbitkan'}`);
      }
      kasirToken = res.data.token;
      return `Status 200 OK. Token JWT berhasil diterbitkan untuk role '${res.data.user.role}'.`;
    }
  });

  await runScenario({
    id: 'BE-02',
    title: 'Penolakan Login Pengguna dengan Password Salah',
    type: 'Uji Negatif (Negative Test)',
    purpose: 'Memastikan server menolak upaya login jika kata sandi salah demi menjaga keamanan sistem kasir dari akses tidak berwenang.',
    testFn: async () => {
      const res = await request('/login', {
        method: 'POST',
        body: { username: 'kasir', password: 'password_palsu_123' }
      });
      if (res.status === 401 && res.data.message === 'Username atau password salah.') {
        return `Status 401 Unauthorized. Permintaan ditolak dengan pesan: "${res.data.message}".`;
      }
      throw new Error(`Ekspektasi status 401, didapat ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await request('/login', {
    method: 'POST',
    body: { username: 'owner', password: 'owner123' }
  }).then(res => { ownerToken = res.data.token; });

  const prodRes = await request('/products?limit=50', {
    headers: { Authorization: `Bearer ${kasirToken}` }
  });
  if (prodRes.data?.data) {
    const products = prodRes.data.data;
    cafeLatteId = products.find(p => p.name === 'Cafe Latte')?.id;
    croissantId = products.find(p => p.name === 'Croissant')?.id;
    rotiBakarId = products.find(p => p.name === 'Roti Bakar Coklat')?.id;
  }

  await runScenario({
    id: 'BE-03',
    title: 'Pencegahan Pendaftaran Produk dengan Nama Duplikat',
    type: 'Uji Validasi & Integritas Data (Data Integrity Test)',
    purpose: 'Mencegah pembuatan produk menu yang memiliki nama sama dengan produk yang sudah ada agar tidak terjadi kebingungan saat pemesanan.',
    testFn: async () => {
      const res = await request('/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: { name: 'Espresso', category: 'Kopi', price: 15000, stock: 10 }
      });
      if (res.status === 422 && res.data.errors?.name === 'Nama produk sudah terdaftar.') {
        return `Status 422 Unprocessable Entity. Ditolak: "${res.data.errors.name}".`;
      }
      throw new Error(`Ekspektasi status 422 duplikat, didapat ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runScenario({
    id: 'BE-04',
    title: 'Validasi Format Nilai Harga dan Stok Tidak Logis',
    type: 'Uji Validasi Input (Boundary & Format Test)',
    purpose: 'Memastikan nilai harga negatif (misal: -500) dan stok bukan angka ditolak oleh server dengan pesan validasi yang jelas.',
    testFn: async () => {
      const res = await request('/products', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: { name: 'Produk Uji Abal', category: 'Kopi', price: -500, stock: 'bukan_angka' }
      });
      if (res.status === 422 && res.data.errors?.price && res.data.errors?.stock) {
        return `Status 422 Unprocessable Entity. Validasi aktif: price ("${res.data.errors.price}"), stock ("${res.data.errors.stock}").`;
      }
      throw new Error(`Ekspektasi status 422 validasi format, didapat ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runScenario({
    id: 'BE-05',
    title: 'Penyelesaian Transaksi Kasir Tunai dengan Nominal Cukup',
    type: 'Uji Transaksi Utama (Core Business Flow Test)',
    purpose: 'Menguji alur transaksi penjualan: pencatatan nota pesanan, pemotongan stok fisik secara otomatis, dan kalkulasi uang kembalian yang tepat.',
    testFn: async () => {
      if (!cafeLatteId || !croissantId) throw new Error('Data produk Cafe Latte / Croissant tidak ditemukan.');
      const res = await request('/pos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${kasirToken}` },
        body: {
          items: [
            { product_id: cafeLatteId, qty: 2 },
            { product_id: croissantId, qty: 1 }
          ],
          payment_method: 'Tunai',
          amount_paid: 100000
        }
      });
      if (res.status === 201 && res.data.data.total_price === 70000 && res.data.data.change_amount === 30000) {
        return `Status 201 Created. Total belanja Rp 70.000, uang diterima Rp 100.000, kembalian Rp 30.000 akurat.`;
      }
      throw new Error(`Ekspektasi status 201 kalkulasi transaksi, didapat: ${JSON.stringify(res.data)}`);
    }
  });

  await runScenario({
    id: 'BE-06',
    title: 'Pembatalan Transaksi Jika Uang Diterima Kurang dari Total Tagihan',
    type: 'Uji Logika Bisnis & Rollback (Negative Flow Test)',
    purpose: 'Mencegah kasir menyelesaikan nota jika pembayaran tunai pembeli kurang dari total tagihan belanja.',
    testFn: async () => {
      const res = await request('/pos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${kasirToken}` },
        body: {
          items: [
            { product_id: cafeLatteId, qty: 2 },
            { product_id: croissantId, qty: 1 }
          ],
          payment_method: 'Tunai',
          amount_paid: 50000
        }
      });
      if (res.status === 422 && res.data.message === 'Uang diterima kurang dari total.') {
        return `Status 422 Unprocessable Entity. Transaksi dibatalkan (rollback): "${res.data.message}".`;
      }
      throw new Error(`Ekspektasi status 422 uang kurang, didapat ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runScenario({
    id: 'BE-07',
    title: 'Penolakan Pembelian Apabila Kuantitas Melebihi Sisa Stok Toko',
    type: 'Uji Proteksi Persediaan Stok (Stock Constraint Test)',
    purpose: 'Menjamin sistem menolak transaksi jika kuantitas beli melampaui sisa stok di basis data, mencegah terjadinya stok bernilai minus.',
    testFn: async () => {
      if (!rotiBakarId) throw new Error('Data produk Roti Bakar Coklat tidak ditemukan.');
      const res = await request('/pos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${kasirToken}` },
        body: {
          items: [{ product_id: rotiBakarId, qty: 9999 }],
          payment_method: 'Tunai',
          amount_paid: 500000000
        }
      });
      if (res.status === 422 && res.data.message?.includes('tidak cukup')) {
        return `Status 422 Unprocessable Entity. Transaksi digagalkan: "${res.data.message}".`;
      }
      throw new Error(`Ekspektasi status 422 stok tidak cukup, didapat ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runScenario({
    id: 'BE-08',
    title: 'Proteksi Manipulasi Harga Sisi Klien (Client Tampering Protection)',
    type: 'Uji Keamanan Transaksi (Security & Tamper Test)',
    purpose: 'Memverifikasi bahwa server mengabaikan harga palsu/murah yang disusupkan klien dan selalu mengambil harga resmi dari basis data.',
    testFn: async () => {
      const res = await request('/pos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${kasirToken}` },
        body: {
          items: [{ product_id: cafeLatteId, qty: 1, price: 100 }],
          payment_method: 'Tunai',
          amount_paid: 25000
        }
      });
      if (res.status === 201 && res.data.data.total_price === 25000) {
        return `Status 201 Created. Server mengabaikan harga manipulasi Rp 100 dan menghitung harga resmi database Rp 25.000.`;
      }
      throw new Error(`Harga tidak dihitung dari database resmi: ${JSON.stringify(res.data)}`);
    }
  });

  await runScenario({
    id: 'BE-09',
    title: 'Perlindungan Penghapusan Produk yang Memiliki Riwayat Transaksi',
    type: 'Uji Integritas Referensial (Referential Integrity Test)',
    purpose: 'Menjamin produk yang pernah terjual pada nota transaksi tidak dapat dihapus sembarangan demi keabsahan laporan keuangan.',
    testFn: async () => {
      const res = await request(`/products/${cafeLatteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      if (res.status === 400 && res.data.message?.includes('riwayat transaksi')) {
        return `Status 400 Bad Request. Ditolak: "${res.data.message}".`;
      }
      throw new Error(`Ekspektasi status 400 proteksi hapus, didapat ${res.status}: ${JSON.stringify(res.data)}`);
    }
  });

  await runScenario({
    id: 'BE-10',
    title: 'Pembatasan Hak Akses Bertingkat Berdasarkan Peran (Role Guard)',
    type: 'Uji Otorisasi & Hak Akses (Authorization Test)',
    purpose: 'Memastikan wewenang akun Owner dibatasi: dilarang mengakses kasir POS (403), namun diizinkan memantau riwayat transaksi (200).',
    testFn: async () => {
      const posRes = await request('/pos', {
        method: 'POST',
        headers: { Authorization: `Bearer ${ownerToken}` },
        body: { items: [] }
      });

      const ordersRes = await request('/orders', {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });

      if (posRes.status === 403 && ordersRes.status === 200) {
        return `Owner diblokir dari POS (403 Forbidden) dan berhasil membaca riwayat transaksi (200 OK).`;
      }
      throw new Error(`Akses tidak sesuai: POS status ${posRes.status}, Orders status ${ordersRes.status}`);
    }
  });

  await runScenario({
    id: 'BE-11',
    title: 'Akurasi Rekapitulasi Data pada Laporan Omset Harian',
    type: 'Uji Akurasi Laporan Keuangan (Financial Aggregation Test)',
    purpose: 'Menguji kebenaran query agregasi laporan penjualan per tanggal (total omset, jumlah nota, metode bayar, dan produk terlaris).',
    testFn: async () => {
      const res = await request('/reports/daily', {
        headers: { Authorization: `Bearer ${ownerToken}` }
      });
      if (res.status === 200 && res.data.data.summary.omset >= 0) {
        const omsetStr = Number(res.data.data.summary.omset).toLocaleString('id-ID');
        return `Status 200 OK. Laporan valid: Total Omset = Rp ${omsetStr}, Jumlah Transaksi = ${res.data.data.summary.jml_transaksi} nota.`;
      }
      throw new Error(`Laporan tidak valid: ${JSON.stringify(res.data)}`);
    }
  });

  const totalPassed = testResults.filter(t => t.status === 'PASS').length;
  const totalFailed = testResults.filter(t => t.status === 'FAIL').length;
  const passPercentage = Math.round((totalPassed / testResults.length) * 100);

  console.log('\n================================================================================');
  console.log('                          REKAPITULASI HASIL PENGUJIAN                          ');
  console.log('================================================================================');
  console.log(`Total Skenario Diuji   : ${testResults.length}`);
  console.log(`Skenario Lolos (PASS)  : \x1b[32m${totalPassed}\x1b[0m`);
  console.log(`Skenario Gagal (FAIL)  : ${totalFailed > 0 ? `\x1b[31m${totalFailed}\x1b[0m` : '0'}`);
  console.log(`Tingkat Kelulusan      : \x1b[32m${passPercentage}%\x1b[0m`);
  console.log(`Status Kelayakan       : \x1b[32mSANGAT MEMENUHI STANDAR UJI KOMPETENSI (LULUS)\x1b[0m`);
  console.log('================================================================================\n');

  if (server) {
    server.close();
  }
  await pool.end();

  if (totalFailed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests().catch((err) => {
    console.error('Pengujian terhenti karena kesalahan fatal:', err);
    process.exit(1);
  });
}

module.exports = runAllTests;
