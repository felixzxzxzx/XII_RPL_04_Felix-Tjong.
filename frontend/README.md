# Dokumentasi Teknis Sisi Depan (Front-End)
### Antarmuka Pengguna POS Web Coffee Shop UMKM (Next.js & React)

Dokumentasi ini disusun untuk memandu siswa kejuruan (SMK Jurusan Pengembangan Perangkat Lunak dan Gim / Rekayasa Perangkat Lunak) dalam memahami arsitektur antarmuka, tata letak responsif, integrasi API, serta manajemen hak akses (*Role Guard*) pada aplikasi kasir kedai kopi.

---

## 1. Konsep dan Arsitektur Front-End

Bagian *Front-End* berfungsi sebagai antarmuka visual yang menghubungkan pengguna (Kasir dan Pemilik) dengan sistem. Aplikasi dibangun menggunakan kerangka kerja modern **Next.js (App Router)** dengan keunggulan:
1. **Pendekatan Berbasis Komponen (*Component-Driven*)**: Setiap elemen antarmuka (bilah navigasi, kartu statistik, tabel produk, kotak dialog konfirmasi) dipecah menjadi modul komponen yang mandiri dan dapat digunakan berulang kali (*reusable*).
2. **Desain Sistem Bertema Kopi (*Coffee-Themed Design System*)**: Menggunakan perpaduan warna hangat yang nyaman di mata dengan aksen utama warna kopi (*Warm Coffee Brown* `#6F4E37`) dan tipografi yang jelas.
3. **Responsif dan Ramah Layar Sentuh (*Mobile-Friendly*)**: Antarmuka dirancang fleksibel menyesuaikan berbagai resolusi layar, mulai dari monitor komputer kasir ($\ge$ 1280x720) hingga telepon pintar Android, lengkap dengan menu laci (*drawer menu*) dan bilah navigasi sentuh.

---

## 2. Matriks Hak Akses Halaman (*Role-Based Access Control*)

Sistem menerapkan proteksi halaman ganda (*Double Layer Guard*) baik pada menu visual maupun pada rute URL:

| Nama Halaman / Fitur | Kasir (`admin`) | Owner (`owner`) | Alamat Rute (*URL*) | Keterangan Wewenang |
| :--- | :---: | :---: | :--- | :--- |
| **Dasbor Utama** | ✅ | ✅ | `/` | Melihat ringkasan operasional dan statistik stok. |
| **Layar Kasir (POS)** | ✅ | ❌ *(403)* | `/pos` | Khusus Kasir untuk memproses penjualan pesanan. |
| **Daftar Katalog Produk** | ✅ | ✅ | `/products` | Kasir dan Owner dapat melihat daftar seluruh menu. |
| **Tambah Menu Baru** | ❌ *(403)* | ✅ | `/products/create` | Wewenang eksklusif Owner untuk menambah produk & foto. |
| **Ubah Informasi Produk** | ⚠️ *(Stok saja)* | ✅ *(Lengkap)* | `/products/:id/edit` | Kasir hanya bisa ubah stok; Owner bisa ubah nama, harga, foto. |
| **Riwayat Penjualan** | ✅ | ✅ | `/orders` | Melihat daftar nota transaksi yang telah selesai. |
| **Rincian & Cetak Struk** | ✅ | ✅ | `/orders/:id` | Menampilkan struk digital dan mencetak struk fisik. |
| **Laporan Harian** | ✅ | ✅ | `/reports/daily` | Rekapitulasi omset, metode pembayaran, dan produk terlaris. |

*Catatan: Tombol "Tambah Produk" otomatis disembunyikan bagi Kasir. Jika Kasir mencoba mengetikkan alamat `/products/create` secara manual di peramban, sistem akan menampilkan halaman penolakan akses (**403 Forbidden**).*

---

## 3. Rincian Fitur Utama Antarmuka

### A. Layar Kasir (*Point of Sale*)
* **Katalog Produk Interaktif**: Dilengkapi kolom pencarian instan dan penyaring kategori (*Kopi*, *Non-Kopi*, *Makanan*). Kartu produk yang kehabisan stok ($0$) otomatis berubah abu-abu dan tidak dapat ditambahkan ke keranjang.
* **Keranjang Belanja Cerdas**: Tombol penambahan kuantitas pesanan ($+$) secara otomatis terkunci jika kuantitas pesanan sudah menyentuh batas sisa stok fisik.
* **Kalkulasi Pembayaran Otomatis**: Mendukung pilihan metode pembayaran **Tunai** dan **QRIS**. Dilengkapi tombol pilihan pecahan uang cepat (Rp 20.000, Rp 50.000, Rp 100.000, uang pas) serta penghitungan uang kembalian secara langsung saat kasir mengetik nominal uang yang diterima.
* **Pemberitahuan Transaksi Berhasil**: Menampilkan pesan kilas hijau (*Flash Alert*) lengkap dengan tombol pintas untuk langsung membuka dan mencetak nota transaksi.

### B. Manajemen Produk & Tampilan Foto
* Menampilkan foto asli menu yang ditarik langsung dari server *backend*.
* Formulir penambahan dan pengubahan produk dilengkapi validasi visual pesan bahasa Indonesia jika data yang diisi belum sesuai.
* Modal konfirmasi hapus produk yang informatif untuk mencegah penghapusan menu secara tidak sengaja.

### C. Format Struk Kasir Standar Industri (*Print Receipt*)
* Tampilan halaman struk transaksi didesain menyerupai kertas nota kasir fisik (*thermal paper 58mm/80mm*).
* Dilengkapi tombol **Cetak Struk Transaksi** yang secara otomatis memicu fungsi cetak peramban (`window.print()`).
* Dilengkapi aturan CSS `@media print` khusus yang secara otomatis menyembunyikan bilah navigasi, tombol, dan latar belakang abu-abu saat dicetak ke mesin printer kasir.

### D. Bilah Navigasi & Profil Pengguna Ramah Ponsel Android
* **Bilah Navigasi Atas (*Top Navbar*)**: Menampilkan judul halaman dinamis, penunjuk rekam jejak halaman (*breadcrumb*), penunjuk jam lokal, tombol profil interaktif, dan tombol keluar instan (*Quick Logout*).
* **Dropdown Profil Layar Sentuh**: Saat avatar profil disentuh di layar ponsel Android, akan terbuka menu tarik-turun (*dropdown*) yang menampilkan identitas pengguna dan tombol **"Keluar (Logout)"**.
* **Menu Laci Samping (*Mobile Sidebar Drawer*)**: Menggunakan tinggi dinamis `100dvh` agar menu navigasi dan tombol keluar di bagian bawah tidak tertutup oleh bilah navigasi bawaan Android.

---

## 4. Panduan Menjalankan Front-End

### Langkah 1: Pengaturan Berkas Lingkungan (`.env.local`)
Buat atau pastikan berkas `.env.local` pada folder `frontend/` telah mengarah ke alamat server backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
*(Jika menggunakan layanan penerusan port atau tunneling seperti Localtunnel, ubah nilai di atas menjadi alamat URL publik yang aktif).*

### Langkah 2: Memasang Dependensi Paket
Buka terminal pada direktori `frontend`, lalu jalankan:
```bash
npm install
```

### Langkah 3: Menjalankan Server Pengembang
Jalankan perintah berikut:
```bash
npm run dev
```
Aplikasi antarmuka akan aktif pada alamat: **`http://localhost:3000`**.

### Langkah 4: Membangun Versi Produksi (*Build*)
Untuk menguji keabsahan kode dan menghasilkan berkas produksi yang optimal:
```bash
npm run build
npm start
```

---

## 5. Akun Pengujian Masuk (*Login*)

Untuk mempermudah pengujian saat demonstrasi, pada halaman login (`/login`) telah disediakan tombol bantu isi cepat (*quick fill*) untuk kedua peran:
* **Akun Kasir**: Username `kasir` / Kata Sandi `kasir123`
* **Akun Pemilik**: Username `owner` / Kata Sandi `owner123`
