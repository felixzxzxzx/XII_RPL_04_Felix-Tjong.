# Panduan dan Dokumentasi Pengujian Otomatis (Automation Testing)
### Modul Back-End POS Web Coffee Shop UMKM (Ujian Praktik Kejuruan PPLG)

Dokumen ini disusun sebagai rujukan teknis pengujian perangkat lunak bagi siswa SMK Jurusan Pengembangan Perangkat Lunak dan Gim (PPLG). Pengujian otomatis (*Automation Testing*) memastikan bahwa setiap fitur, validasi logika bisnis, dan mekanisme keamanan basis data bekerja secara konsisten tanpa galat (*error*).

---

## 1. Konsep Dasar Pengujian Otomatis

*Automation Testing* adalah proses pengujian perangkat lunak di mana skrip program secara mandiri mengirimkan berbagai macam kombinasi data (baik data yang sah maupun data yang salah/rusak) ke server API, kemudian secara otomatis membandingkan respons server dengan kriteria yang diharapkan.

### Manfaat Pengujian Otomatis:
1. **Kecepatan & Efisiensi**: Menguji seluruh fungsionalitas sistem (11 skenario) hanya dalam hitungan detik.
2. **Mendeteksi Regresi (*Bug Prevention*)**: Memastikan perubahan kode di satu bagian tidak merusak fungsi yang sudah berjalan sebelumnya.
3. **Standarisasi Penilaian Ujian**: Memberikan bukti konkret (*concrete evidence*) kepada penguji bahwa seluruh aturan bisnis (*business rules*) telah terpenuhi 100%.

---

## 2. Cara Menjalankan Skrip Pengujian

Pastikan layanan basis data **MySQL pada XAMPP** telah aktif, kemudian buka terminal pada direktori `backend` dan jalankan:

```bash
cd backend
npm test
```

> **Catatan Teknis**: Skrip pengujian dirancang cerdas (*self-contained*). Apabila server backend utama belum dinyalakan secara manual, skrip pengujian akan secara otomatis mengaktifkan server pengujian internal (*ephemeral server*) dan langsung mengeksekusi pengujian hingga tuntas.

---

## 3. Rincian 11 Skenario Pengujian (BE-01 s.d. BE-11)

Skrip pengujian menguji dua jenis kondisi utama:
* **Uji Positif (*Positive Testing*)**: Menguji apakah sistem bekerja sebagaimana mestinya ketika pengguna memasukkan data yang sah.
* **Uji Negatif (*Negative / Boundary Testing*)**: Menguji apakah sistem mampu menolak dan mengamankan data ketika pengguna memasukkan data yang salah, bernilai minus, uang kurang, atau mencoba melakukan kecurangan.

Berikut adalah tabel rincian ke-11 skenario pengujian yang diimplementasikan:

| Kode Uji | Nama Skenario | Kategori Pengujian | Tujuan & Penjelasan Logika Bisnis | Input / Aksi Pengujian | Status HTTP & Ekspektasi Hasil |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **BE-01** | Autentikasi Kasir Valid | Uji Positif (*Positive Flow*) | Menguji alur login akun kasir yang sah dan memastikan server menerbitkan token JWT serta mengembalikan data identitas peran (`admin`). | `POST /login`<br>Body: `{ username: "kasir", password: "kasir123" }` | **200 OK**<br>Token JWT berhasil didapatkan. |
| **BE-02** | Penolakan Password Salah | Uji Negatif (*Negative Security*) | Memastikan akun terlindungi dari percobaan login ilegal dengan memeriksa penolakan kredensial yang salah. | `POST /login`<br>Body: `{ username: "kasir", password: "password_palsu" }` | **401 Unauthorized**<br>Pesan: *"Username atau password salah."* |
| **BE-03** | Pencegahan Nama Produk Kembar | Uji Validasi & Integritas | Mencegah penambahan produk baru dengan nama yang sudah terdaftar di database agar tidak membingungkan kasir saat transaksi. | `POST /products`<br>Body: `{ name: "Espresso", ... }` | **422 Unprocessable Entity**<br>Pesan: *"Nama produk sudah terdaftar."* |
| **BE-04** | Validasi Harga & Stok Tidak Logis | Uji Validasi Input (*Boundary Test*) | Memastikan server menolak input harga bernilai minus (misal: `-500`) dan stok yang bukan angka guna menjaga integritas data. | `POST /products`<br>Body: `{ price: -500, stock: "abc" }` | **422 Unprocessable Entity**<br>Pesan kesalahan spesifik pada *field* harga dan stok. |
| **BE-05** | Transaksi Tunai Kasir Sah | Uji Transaksi Utama (*Core Flow*) | Menguji siklus utama penjualan kasir: pencatatan nota transaksi, pemotongan stok otomatis di database, dan penghitungan kembalian uang. | `POST /pos`<br>Beli: 2 Kopi Latte + 1 Croissant (Rp 70.000)<br>Bayar: Rp 100.000 Tunai | **201 Created**<br>Kembalian Rp 30.000 tepat, stok fisik produk langsung terpotong. |
| **BE-06** | Uang Tunai Pembeli Kurang | Uji Logika Bisnis (*Rollback Test*) | Menjamin kasir tidak bisa menyelesaikan nota pesanan jika uang pembayaran pelanggan kurang dari nilai total belanja. | `POST /pos`<br>Tagihan: Rp 70.000<br>Bayar: Rp 50.000 | **422 Unprocessable Entity**<br>Transaksi dibatalkan (*rollback*), stok tidak terpotong. |
| **BE-07** | Pembelian Melebihi Sisa Stok | Uji Pembatasan Stok (*Stock Protection*) | Menjamin sistem membatalkan transaksi jika kuantitas pesanan melampaui sisa stok fisik di toko (mencegah stok bernilai minus). | `POST /pos`<br>Pesan: 9.999 porsi Roti Bakar | **422 Unprocessable Entity**<br>Pesan: *"Stok tidak cukup"*, transaksi dibatalkan. |
| **BE-08** | Proteksi Manipulasi Harga Klien | Uji Keamanan (*Client Tampering*) | Memastikan server mengabaikan manipulasi harga murah yang dikirim oleh klien peramban dan selalu mengambil harga resmi database MySQL. | `POST /pos`<br>Kirim harga palsu: `price: 100` pada Cafe Latte | **201 Created**<br>Server mengabaikan harga 100 dan menghitung total harga resmi (Rp 25.000). |
| **BE-09** | Perlindungan Hapus Menu Terjual | Uji Integritas Referensial (*FK Protection*) | Melindungi keaslian data riwayat pembukuan; produk yang sudah pernah ada di riwayat transaksi dilarang untuk dihapus. | `DELETE /products/:id`<br>Menghapus produk yang sudah pernah terjual | **400 Bad Request**<br>Pesan: *"Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi."* |
| **BE-10** | Pembatasan Hak Akses (*Role Guard*) | Uji Otorisasi (*Access Control*) | Memverifikasi pembagian tugas; Pemilik (*Owner*) dilarang masuk ke layar transaksi POS (403), namun diizinkan melihat riwayat penjualan (200). | `POST /pos` & `GET /orders`<br>Menggunakan token milik Owner | **403 Forbidden** pada POS Kasir,<br>**200 OK** pada Riwayat Order. |
| **BE-11** | Akurasi Laporan Omset Harian | Uji Agregasi Keuangan (*Financial Test*) | Memastikan kalkulasi laporan harian (total omset, jumlah nota transaksi, dan produk terlaris) akurat sesuai data riwayat nota. | `GET /reports/daily`<br>Mengambil rekapitulasi penjualan hari ini | **200 OK**<br>Total omset dan jumlah transaksi akurat sesuai riwayat order. |

---

## 4. Contoh Tampilan Output Terminal

Ketika pengujian otomatis dijalankan melalui perintah `npm test`, terminal akan menampilkan laporan eksekusi seperti berikut:

```text
================================================================================
       PENGUJIAN OTOMATIS BACK-END (AUTOMATION TESTING SUITE BE-01 - BE-11)      
                    Ujian Praktik Kejuruan PPLG / RPL                           
================================================================================
Endpoint Uji : http://127.0.0.1:5000
Waktu Uji    : 01/10/2026, 11:15:00

--------------------------------------------------------------------------------
[BE-01] Autentikasi Kasir dengan Kredensial Valid
Tipe Uji : Uji Positif (Positive Test)
Tujuan   : Memverifikasi bahwa akun kasir yang sah dapat login dan memperoleh token JWT beserta identitas peran (role) yang tepat.
Hasil    : [PASS] BERHASIL -> Status 200 OK. Token JWT berhasil diterbitkan untuk role 'admin'.
--------------------------------------------------------------------------------
[BE-02] Penolakan Login Pengguna dengan Password Salah
Tipe Uji : Uji Negatif (Negative Test)
Tujuan   : Memastikan server menolak upaya login jika kata sandi salah demi menjaga keamanan sistem kasir dari akses tidak berwenang.
Hasil    : [PASS] BERHASIL -> Status 401 Unauthorized. Permintaan ditolak dengan pesan: "Username atau password salah.".
--------------------------------------------------------------------------------
...
================================================================================
                          REKAPITULASI HASIL PENGUJIAN                          
================================================================================
Total Skenario Diuji   : 11
Skenario Lolos (PASS)  : 11
Skenario Gagal (FAIL)  : 0
Tingkat Kelulusan      : 100%
Status Kelayakan       : SANGAT MEMENUHI STANDAR UJI KOMPETENSI (LULUS)
================================================================================
```
