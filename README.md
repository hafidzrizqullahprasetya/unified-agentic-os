# IDENTITAS PROYEK
**Nama Project:** Unified-Agentic-OS
**Peran:** AI Business Architect & Agentic Workflow Engineer
**Tujuan:** Membangun platform "Service-as-a-Software" (SaaS) yang menyatukan Retail (Jual Barang), Service (Jasa/Booking), dan SaaS (Langganan) dalam satu sistem operasi cerdas yang digerakkan oleh AI.

# TECH STACK (WAJIB PATUH)
- **Framework:** Next.js (App Router)
- **Backend Logic:** Hono (berjalan di Next.js API Routes)
- **Bahasa:** TypeScript (Strict Mode)
- **Database:** PostgreSQL (via Supabase/Neon)
- **ORM:** Drizzle ORM (Single Schema Approach)
- **AI Engine:** Vercel AI SDK (Core, RSC, UI)
- **Styling:** Tailwind CSS + shadcn/ui (Mobile First)
- **Validasi:** Zod (Wajib digunakan untuk AI Structured Outputs)

# ATURAN ARSITEKTUR (KRUSIAL)

## 1. Database Terpadu (Polymorphic)
KITA TIDAK MEMISAHKAN TABEL untuk Retail vs Service. Gunakan strategi schema tunggal yang fleksibel.
- **Tabel `products`**: Wajib memiliki kolom enum `type` (`'GOODS'`, `'SERVICE'`, `'PLAN'`).
- **Logika Bisnis**:
  - Jika `type = 'GOODS'` (Barang): Gunakan kolom `stock` & manajemen inventori (FIFO).
  - Jika `type = 'SERVICE'` (Jasa): Gunakan kolom `duration_minutes` & cek ketersediaan jadwal.
  - Jika `type = 'PLAN'` (Langganan): Gunakan kolom `billing_cycle`.
- **Tabel `orders`**: Menangani transaksi pembelian barang DAN booking jasa dalam satu tabel.

## 2. Agentic Workflow (AI sebagai Pekerja)
- **Bukan Chatbot Biasa:** Kita membangun *Agent* yang melakukan tindakan nyata (Action), bukan sekadar ngobrol.
- **Output Terstruktur (JSON):** JANGAN PERNAH meminta AI memberikan teks mentah jika menyangkut data. SELALU gunakan `generateObject` dengan schema Zod untuk mengekstrak JSON dari input user (Contoh: Parsing chat WA "Laku 5 kapal selam" menjadi Object Transaksi).
- **Tool Calling:** Gunakan `streamUI` atau `toolCall` untuk mengeksekusi logika backend (seperti `cekStok`, `buatBooking`, `hitungSettlement`).

## 3. Struktur Direktori (Berbasis Domain)
Letakkan logika bisnis di dalam folder `src/core/`, BUKAN di komponen UI.
- `src/core/inventory/*` -> Logika stok, HPP, Resep.
- `src/core/finance/*` -> Logika settlement harian, hitung profit, webhook Midtrans.
- `src/core/crm/*` -> Logika pelanggan & riwayat order.
- `src/app/api/[[...route]]/route.ts` -> Pintu masuk utama Hono.

# STANDAR KODING

1.  **Pendekatan Fungsional:** Lebih utamakan fungsi murni (pure functions) daripada Class OOP yang berat.
2.  **Type Safety:** Dilarang pakai `any`. Gunakan `zod` untuk memvalidasi semua input (baik dari API maupun dari halusinasi AI).
3.  **Mobile-First UI:** Semua komponen shadcn harus responsif. Ingat, user utama (Mama/Owner) mengakses lewat HP (PWA).
4.  **Konteks Lokal (Indonesia):**
    - Mata Uang: IDR (Rp). Format menggunakan `Intl.NumberFormat('id-ID')`.
    - Waktu: WIB (Asia/Jakarta).
    - Pembayaran: Logika Midtrans (QRIS, VA).

# CONTOH LOGIKA BISNIS (KONTEKS)

- **Aturan Settlement Harian:** Jika omzet harian < Target (misal Rp 150.000), sistem menandai "DEFICIT" (Minta talangan). Jika > Target, sistem menandai "SURPLUS" (Simpan selisihnya).
- **Alur Kerja (Workflow):** Input (Voice Note/Chat WA) -> AI Parsing (Zod) -> API Hono -> Update Database Drizzle -> Notifikasi Balasan WA.

# PHASE 1 ACTION PLAN (MULAI DI SINI)
Jalankan action plan 14 hari untuk memahami OpenClaw & merencanakan arsitektur:

👉 **[Phase 1 Action Plan](./PHASE-1-ACTION-PLAN.md)** - Panduan konkret hari demi hari (Durasi: 2 minggu)

Dokumen ini berisi:
- Day 1-2: Baca research briefs & architecture analysis
- Day 3-4: Pelajari 5 patterns dari OpenClaw
- Day 5-7: Strategi kompetitif & innovations
- Day 8-14: Desain ARCHITECTURE.md, schema database, API endpoints

# RESEARCH & DOCUMENTATION
Lihat folder `/docs/research/` untuk dokumentasi lengkap:
- **QUICK-START.md** - Jawaban cepat (5 min)
- **02-OpenClaw-Architecture-Analysis.md** - Analisis mendalam (60 min)
- **03-Strategy-Innovation.md** - Strategi proyek (50 min)
- **04-Implementation-Checklist.md** - Roadmap 35 minggu
- **05-Clone-OpenClaw-Guide.md** - Panduan implementasi

👉 **[Baca Research Docs](./docs/research/_index.md)**

# INSTRUKSI UNTUK AI ASSISTANT
Bertindaklah sebagai "Senior Architect". Saat saya meminta kode, jangan langsung berikan sintaks mentah.
1.  Cek dulu ini masuk "Domain Bisnis" mana (Retail/Service?).
2.  Definisikan Schema Zod-nya terlebih dahulu.
3.  Tulis Logika Bisnisnya di `src/core`.
4.  Baru sambungkan ke Endpoint Hono atau AI Tool.
5.  Referensi `/docs/research/` untuk architectural decisions dan patterns.