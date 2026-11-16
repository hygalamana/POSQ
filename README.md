# 🛍️ PosQ - Aplikasi Kasir Toko Modern untuk Windows

<p align="center">
  <img src="frontend/public/favicon.ico" width="80" height="80" alt="PosQ Logo" />
  <br />
  <strong>Aplikasi Kasir POS (Point of Sale) Cepat, Ringan, Offline-First, dan Dirancang Khusus untuk Komputer Kasir Windows.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6.svg?logo=windows" alt="Windows" />
  <img src="https://img.shields.io/badge/React-18-blue.svg?logo=react" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-6.x-purple.svg?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express-green.svg?logo=node.js" alt="Express" />
  <img src="https://img.shields.io/badge/Database-SQLite%20(WAL)-blue.svg?logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/ORM-Drizzle-yellow.svg" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg?logo=tailwind-css" alt="Tailwind" />
</p>

---

## 🌟 Fitur Utama

- ⚡ **Offline-First**: Kasir tetap bisa melayani transaksi meski internet mati. Data disimpan aman di database lokal komputer kasir.
- 🧾 **Cetak Struk & Printer Thermal**: Kompatibel dengan semua printer struk USB di Windows (58mm / 80mm) serta printer Bluetooth ESC/POS.
- 💳 **Pembayaran Fleksibel**: Dukungan pembayaran Tunai (hitung kembalian otomatis) dan QRIS Statis/Dinamis.
- 👥 **Multi-Role RBAC**:
  - **Owner**: Akses penuh seluruh sistem, laporan laba/rugi (HPP), backup & restore database, kelola cabang toko, dan pengaturan QRIS.
  - **Manager**: Kelola produk, atur stok & kategori, monitor kasir, dan riwayat transaksi.
  - **Kasir**: Antarmuka kasir cepat (POS), input keranjang, simpan/bayar transaksi, dan rekap shift kasir.
- 🕒 **Manajemen Shift Kasir**: Kontrol modal awal kas, hitung total uang tunai masuk, dan cegah selisih fisik uang kasir.
- 📊 **Laporan & Analitik**: Rekap penjualan harian, grafik pendapatan, estimasi laba bersih, dan tombol 1-klik ekspor ke Microsoft Excel (.xlsx).
- 💾 **Backup & Restore Database**: Cadangkan dan pulihkan database SQLite dalam 1 klik dengan verifikasi integritas data otomatis.
- ⚙️ **Otomatisasi Komputer Kasir**: File `.bat` bawaan untuk startup otomatis saat komputer kasir dinyalakan dan bangun otomatis dari mode Sleep di pagi hari.

---

## 🔐 Akun Login Bawaan (Default Demo)

Setelah data awal diisi (*seeding*), buka browser di `http://localhost:9990` dan login menggunakan akun:

| Peran (Role) | Email | Password | Hak Akses |
|---|---|---|---|
| **Owner** | `owner@demo.com` | `demo123` | Akses penuh seluruh fitur, laporan, dan menu pengaturan |
| **Manager** | `manager@demo.com` | `demo123` | Manajemen produk, kategori, stok, laporan, dan kasir |
| **Kasir** | `kasir@demo.com` | `demo123` | Khusus transaksi kasir (POS), cetak struk, dan buka/tutup shift |

---

## 🚀 Panduan Lengkap Instalasi & Menjalankan di Windows

Ikuti panduan langkah demi langkah berikut untuk memasang PosQ di komputer Windows:

### 1. Prasyarat Sistem Windows
Pastikan komputer Windows Anda sudah terpasang:
1. **Node.js (Versi 18 LTS atau 20 LTS)**:
   * Unduh installer Windows di: **[nodejs.org](https://nodejs.org/)** (pilih versi *LTS* lalu install seperti biasa sampai selesai).
2. **Git for Windows**:
   * Unduh installer Windows di: **[git-scm.com](https://git-scm.com/)**.

---

### 2. Langkah-Langkah Instalasi (Melalui Terminal Windows)

Buka **PowerShell** atau **Command Prompt (CMD)**, lalu jalankan langkah berikut:

#### Langkah 1: Download / Clone Project
```powershell
git clone https://github.com/hysers/posq.git
cd posq
```
*(Atau jika Anda mengunduh file ZIP, ekstrak foldernya lalu buka PowerShell di dalam folder tersebut)*.

#### Langkah 2: Buat File Pengaturan (`.env`)
Jalankan perintah copy berikut untuk membuat file konfigurasi:
```powershell
copy .env.example .env
```

#### Langkah 3: Install Dependensi Project
Install seluruh modul yang diperlukan:
```powershell
npm install
```
*(Tunggu 1-2 menit hingga proses instalasi paket selesai)*.

#### Langkah 4: Inisialisasi Database & Isi Data Demo
Buat database SQLite lokal dan isi data awal toko, pengguna, kategori, dan produk contoh:
```powershell
npm run seed -w backend
```
> *Database tersimpan secara lokal di folder `backend/prisma/dev.db`.*

#### Langkah 5: Kompilasi / Build Aplikasi
Build frontend dan backend ke mode produksi:
```powershell
npm run build
```

#### Langkah 6: Jalankan Aplikasi Kasir
Untuk menjalankan server kasir, Anda punya **2 pilihan mudah**:

* **Pilihan A (Paling Praktis)**:  
  Cukup buka folder project di Windows Explorer, lalu **klik dua kali file `JALANKAN KASIR.bat`**. Browser kasir akan otomatis terbuka!
* **Pilihan B (Melalui Terminal)**:  
  Ketik perintah:
  ```powershell
  npm start
  ```

Setelah server aktif, buka browser Google Chrome / Microsoft Edge di komputer Anda dan akses:
👉 **`http://localhost:9990`**

---

## 🛠️ Menu Kelola Akun & Cabang Toko Windows

Anda dapat menambah cabang toko baru, membuat akun kasir tambahan, atau mereset password melalui menu visual terminal:

### Cara Menggunakan:
Cukup **klik dua kali file `KELOLA AKUN.bat`** di Windows Explorer.

Atau jalankan melalui PowerShell/CMD:
```powershell
call "KELOLA AKUN.bat"
```

### Perintah Cepat CLI Windows:
```powershell
# Melihat seluruh daftar toko dan akun kasir
npm run user:list

# Membuat cabang toko baru
node backend/buat-toko.js "Nama Toko Baru" "owner@toko.com" "password123"

# Menambah akun kasir ke toko
node backend/tambah-akun.js "Nama Toko" "kasir1@toko.com" "password123" CASHIER

# Reset password kasir yang lupa
node backend/reset-password.js "kasir1@toko.com" "passwordBaru123"

# Mengubah role akun (OWNER | MANAGER | CASHIER)
node backend/user-role.js "kasir1@toko.com" MANAGER

# Menghapus akun kasir secara aman
node backend/hapus-akun.js "kasir1@toko.com"
```

---

## 💻 Menjalankan Mode Pengembangan (Development)

Jika Anda seorang programmer yang ingin mengubah tampilan atau menambah fitur:

1. Jalankan mode pengembangan dengan live hot-reload:
   ```powershell
   npm run dev
   ```
2. Buka browser:
   * **Frontend (Vite Dev)**: `http://localhost:9990`
   * **Backend API (Express)**: `http://localhost:9991`

---

## 📁 Struktur Folder Proyek

```text
POSQ/
├── backend/                  # Server Node.js Express + SQLite
│   ├── prisma/               # Lokasi file database lokal dev.db
│   ├── src/
│   │   ├── config/           # Koneksi SQLite (WAL), Cloudinary, Mock Redis
│   │   ├── db/               # Schema Drizzle, initDb.ts (auto create table), seed.ts
│   │   ├── middleware/       # Autentikasi JWT, RBAC, validasi schema Zod
│   │   ├── modules/          # Modul API (auth, sales, products, shifts, reports, dll.)
│   │   ├── utils/            # Helper invoice, status, responses
│   │   └── app.ts            # Entry point backend & static frontend serving
│   └── *.js                  # Script CLI pengelolaan akun toko
├── frontend/                 # Aplikasi Web Kasir React 18 + Vite
│   ├── public/               # Logo, icon, favicon
│   └── src/
│       ├── components/       # Komponen UI (POS, Settings, Layout, Transaksi)
│       ├── hooks/            # Custom React hooks (products, sync, categories)
│       ├── lib/              # Client API, format rupiah, bluetooth printer ESC/POS
│       ├── pages/            # Halaman kasir (Pos, Login, Products, Reports, dll.)
│       ├── stores/           # Global state management Zustand (keranjang, auth)
│       ├── App.tsx           # Router aplikasi
│       └── DashboardLayout.tsx
├── .env.example              # Template file konfigurasi
├── JALANKAN KASIR.bat        # Runner 1-klik aplikasi kasir Windows
├── KELOLA AKUN.bat           # Menu interaktif kelola toko & akun Windows
├── PASANG STARTUP OTOMATIS.bat # Pemasang auto-start saat Windows booting
└── README.md                 # Dokumentasi panduan instalasi
```

---

## 📄 Lisensi
Project ini didistribusikan di bawah lisensi ISC. Bebas digunakan dan disesuaikan untuk kebutuhan bisnis toko Anda.
