# Kedai TehYan — POS & QR Web System

Sistem pemesanan QR dan POS terintegrasi untuk Kedai TehYan.

## Struktur Proyek

```
tehyan-pos/
├── package.json                    # Root monorepo (npm workspaces)
├── apps/
│   ├── backend/                    # Node.js + Express + Socket.io + Prisma
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # DB schema (MySQL)
│   │   │   └── seed.js             # Data awal (kategori, produk, meja)
│   │   └── src/
│   │       ├── server.js           # Entry point backend
│   │       └── routes/api.js       # Semua REST endpoint
│   ├── pos/                        # React 18 (Vite) — POS Kasir
│   │   └── src/
│   │       ├── main.jsx
│   │       ├── App.jsx
│   │       └── components/
│   │           └── CashierView.jsx
│   └── qr-web/                     # Next.js 14 — QR Menu Pelanggan
│       ├── app/
│       │   ├── layout.jsx
│       │   └── [tableId]/
│       │       ├── page.jsx         # Server Component
│       │       └── TableMenuClient.jsx  # Client Component
│       └── components/
│           └── CheckoutModal.jsx
```

## Prasyarat

- **Node.js** >= 18
- **XAMPP** dengan MySQL aktif di port 3306

---

## Setup Langkah Demi Langkah

### 1. Clone & Install

```bash
# Masuk ke folder proyek
cd tehyan-pos

# Install semua dependencies (root + semua workspaces)
npm install
```

### 2. Setup Database (XAMPP)

1. Pastikan **Apache** dan **MySQL** XAMPP sudah berjalan
2. Buka **phpMyAdmin** → buat database baru: `tehyan_pos`

### 3. Konfigurasi Environment Backend

```bash
# Salin file contoh
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/tehyan_pos"
PORT=5000
NODE_ENV=development
CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

> Jika MySQL XAMPP Anda menggunakan password, ubah `root:` menjadi `root:PASSWORD_ANDA`.

### 4. Konfigurasi Environment QR Web

Buat file `apps/qr-web/.env.local`:
```env
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

### 5. Migrasi & Seed Database

```bash
# Generate Prisma Client
npm run generate --workspace=apps/backend

# Jalankan migrasi database
npm run db:migrate

# Isi data awal (kategori, produk, 10 meja)
npm run db:seed
```

### 6. Jalankan Semua Aplikasi

```bash
# Jalankan backend + POS + QR Web sekaligus
npm run dev
```

Atau secara terpisah:
```bash
npm run dev:backend   # http://localhost:5000
npm run dev:pos       # http://localhost:5173
npm run dev:qr        # http://localhost:3000
```

---

## URL Aplikasi

| Aplikasi | URL | Deskripsi |
|----------|-----|-----------|
| Backend API | `http://localhost:5000/api` | REST API + Socket.io |
| Health Check | `http://localhost:5000/health` | Status server |
| POS Kasir | `http://localhost:5173` | Dashboard kasir |
| QR Menu (Meja 1) | `http://localhost:3000/1` | Halaman pelanggan meja 1 |

---

## Endpoint API Utama

| Method | Path | Deskripsi |
|--------|------|-----------|
| `GET` | `/api/products` | Semua produk (filter: `?categoryId=`, `?search=`) |
| `POST` | `/api/products` | Tambah produk baru |
| `PATCH` | `/api/products/:id` | Update produk |
| `DELETE` | `/api/products/:id` | Hapus produk |
| `GET` | `/api/categories` | Semua kategori |
| `GET` | `/api/tables` | Semua meja |
| `POST` | `/api/orders` | **Buat pesanan baru** (emit `new-order` ke kasir) |
| `GET` | `/api/orders` | Semua pesanan (filter: `?status=`, `?tableId=`) |
| `PATCH` | `/api/orders/:id/status` | Update status pesanan |
| `POST` | `/api/payments` | Proses pembayaran |

## Socket.io Events

| Event | Direction | Deskripsi |
|-------|-----------|-----------|
| `join:cashier` | Client → Server | Kasir bergabung ke cashier-room |
| `join:table` | Client → Server | Pelanggan bergabung ke table-{id} |
| `new-order` | Server → Kasir | Pesanan baru masuk |
| `order:updated` | Server → Kasir | Status pesanan berubah |
| `order:confirmed` | Server → Pelanggan | Konfirmasi pesanan diterima |
| `order:status-updated` | Server → Pelanggan | Update status untuk pelanggan |
| `order:paid` | Server → Pelanggan | Notifikasi pembayaran selesai |
| `payment:completed` | Server → Kasir | Pembayaran berhasil diproses |
