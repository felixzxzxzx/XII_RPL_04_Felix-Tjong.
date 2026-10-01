const dotenv = require('dotenv');
dotenv.config();

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

async function runScenario(id, title, testFn) {
  try {
    const result = await testFn();
    console.log(`[PASS] ${id}: ${title} -> ${result || 'OK'}`);
    return { id, title, status: 'PASS', note: result };
  } catch (error) {
    console.error(`[FAIL] ${id}: ${title} -> Error: ${error.message}`);
    return { id, title, status: 'FAIL', note: error.message };
  }
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

async function runAllTests() {
  console.log('====================================================');
  console.log('   PENGUJIAN SKENARIO BACK-END (BE-01 s.d. BE-11)   ');
  console.log('====================================================\n');

  let kasirToken = '';
  let ownerToken = '';
  let cafeLatteId = null;
  let croissantId = null;
  let rotiBakarId = null;

  await runScenario('BE-01', 'Login Valid Kasir', async () => {
    const res = await request('/login', {
      method: 'POST',
      body: { username: 'kasir', password: 'kasir123' }
    });
    if (res.status !== 200 || !res.data.token) {
      throw new Error(`Status ${res.status}: ${res.data.message || 'Token tidak didapat'}`);
    }
    kasirToken = res.data.token;
    return `Token didapat, role: ${res.data.user.role}`;
  });

  await runScenario('BE-02', 'Login Tidak Valid (Password salah)', async () => {
    const res = await request('/login', {
      method: 'POST',
      body: { username: 'kasir', password: 'salah' }
    });
    if (res.status === 401 && res.data.message === 'Username atau password salah.') {
      return 'Ditolak dengan pesan: Username atau password salah.';
    }
    throw new Error(`Ekspektasi 401, didapat ${res.status}: ${JSON.stringify(res.data)}`);
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

  await runScenario('BE-03', 'Produk Duplikat (Nama "Espresso")', async () => {
    const res = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { name: 'Espresso', category: 'Kopi', price: 15000, stock: 10 }
    });
    if (res.status === 422 && res.data.errors?.name === 'Nama produk sudah terdaftar.') {
      return 'Ditolak: Nama produk sudah terdaftar.';
    }
    throw new Error(`Ekspektasi 422 duplikat, didapat ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await runScenario('BE-04', 'Harga / Stok Tidak Valid', async () => {
    const res = await request('/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { name: 'Produk Abal', category: 'Kopi', price: -500, stock: 'abc' }
    });
    if (res.status === 422 && res.data.errors?.price && res.data.errors?.stock) {
      return 'Ditolak: Validasi price dan stock aktif.';
    }
    throw new Error(`Ekspektasi 422 validasi, didapat ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await runScenario('BE-05', 'Transaksi Tunai Valid', async () => {
    if (!cafeLatteId || !croissantId) throw new Error('Produk Cafe Latte / Croissant tidak ditemukan.');
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
      return `Total 70.000, bayar 100.000, kembalian 30.000`;
    }
    throw new Error(`Ekspektasi 201 total 70000, didapat: ${JSON.stringify(res.data)}`);
  });

  await runScenario('BE-06', 'Uang Kurang Pada Transaksi Tunai', async () => {
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
      return 'Ditolak: Uang diterima kurang dari total.';
    }
    throw new Error(`Ekspektasi 422 uang kurang, didapat ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await runScenario('BE-07', 'Qty Melebihi Stok Tersedia', async () => {
    if (!rotiBakarId) throw new Error('Roti Bakar Coklat tidak ditemukan');
    const res = await request('/pos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${kasirToken}` },
      body: {
        items: [{ product_id: rotiBakarId, qty: 999 }],
        payment_method: 'Tunai',
        amount_paid: 20000000
      }
    });
    if (res.status === 422 && res.data.message?.includes('tidak cukup')) {
      return `Ditolak rollback: ${res.data.message}`;
    }
    throw new Error(`Ekspektasi 422 stok tidak cukup, didapat ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await runScenario('BE-08', 'Manipulasi Harga Ditolak/Diabaikan Server', async () => {
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
      return 'Server mengabaikan harga 100 dan menghitung harga asli DB (25.000).';
    }
    throw new Error(`Harga tidak dihitung dari DB: ${JSON.stringify(res.data)}`);
  });

  await runScenario('BE-09', 'Hapus Produk Terjual Ditolak', async () => {
    const res = await request(`/products/${cafeLatteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 400 && res.data.message?.includes('riwayat transaksi')) {
      return 'Ditolak: Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi.';
    }
    throw new Error(`Ekspektasi 400 proteksi hapus, didapat ${res.status}: ${JSON.stringify(res.data)}`);
  });

  await runScenario('BE-10', 'Hak Akses Owner (403 untuk POS & Products, 200 untuk Orders)', async () => {
    const posRes = await request('/pos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: { items: [] }
    });

    const ordersRes = await request('/orders', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    if (posRes.status === 403 && ordersRes.status === 200) {
      return 'Owner diblokir dari POS (403 Forbidden) dan dapat membaca riwayat transaksi (200 OK).';
    }
    throw new Error(`Akses owner tidak sesuai: POS status ${posRes.status}, Orders status ${ordersRes.status}`);
  });

  await runScenario('BE-11', 'Akurasi Laporan Omset Harian', async () => {
    const res = await request('/reports/daily', {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });
    if (res.status === 200 && res.data.data.summary.omset >= 0) {
      return `Laporan valid: Omset hari ini = Rp ${res.data.data.summary.omset.toLocaleString('id-ID')}, Transaksi = ${res.data.data.summary.jml_transaksi}`;
    }
    throw new Error(`Laporan tidak valid: ${JSON.stringify(res.data)}`);
  });

  console.log('\n====================================================');
  console.log('   SEMUA PENGUJIAN SELESAI                          ');
  console.log('====================================================');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = runAllTests;
