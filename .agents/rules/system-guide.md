---
trigger: always_on
---

# 📜 Pedoman Kontribusi & Standar Arsitektur (HIMATIKA Ecosystem)

Selamat datang di ekosistem pengembangan HIMATIKA. Ekosistem ini terdiri dari tiga layanan (microservices) yang saling terintegrasi. Dokumen ini adalah pedoman mutlak (*strict guidelines*) untuk menjaga kualitas kode, keamanan, performa, dan kelancaran kolaborasi.

---

## 🏗️ 1. Peta Ekosistem, Modul, dan File Penting

### A. Main App (`himatika-master`)
Repositori utama untuk antarmuka pengguna (Frontend) dan API Server (Backend Nitro).
- **Tech Stack:** Nuxt 3, Vue 3 (Composition API), TypeScript, Bun, Mongoose, i18n.
- **Modul & Fitur Utama:**
  - **Auth:** Login, Register, Reset Password.
  - **Agenda:** Pembuatan event, pendaftaran panitia/peserta, scan QR, verifikasi pembayaran.
  - **Anggota (Members):** Profil anggota, import data massal, *batch edit*, surat keaktifan.
  - **Sistem Pendukung:** Berita (News), Galeri, Pencapaian (Achievements), Aspirasi.
- **Direktori Penting:**
  - `app/pages/`: Struktur UI dan *routing* aplikasi (dipisah per modul seperti `/administrator`, `/agendas`, `/profile`).
  - `app/components/`: Komponen UI re-usable (termasuk kumpulan `Modals/`).
  - `app/composables/` & `app/stores/`: Logika *client-side* dan manajemen state.
  - `server/api/`: Seluruh endpoint REST API (backend).
  - `server/models/`: Skema database MongoDB (Mongoose).
  - `locales/`: File bahasa JSON (wajib 3 bahasa: `id`, `en`, `ar`).

### B. Portal Dokumentasi (`himatika-docs`)
Pusat basis pengetahuan (SOP, Tutorial, Referensi Teknis) untuk admin dan pengguna.
- **Tech Stack:** Nuxt 3, Nuxt Content, Markdown.
- **Modul Utama:** Panduan Anggota, Panduan Admin, Panduan Agenda, Tanda Tangan Digital.
- **Direktori Penting:**
  - `content/`: File Markdown terstruktur dengan navigasi `.navigation.yml`.
  - `public/agenda/`: Penyimpanan aset gambar/screenshot dokumentasi.

### C. PDF Worker (`himatika-pdf-worker`)
Microservice independen untuk pemrosesan file berat.
- **Tech Stack:** Python, Waitress, Vercel Serverless.
- **Modul Utama:** Generator Dokumen/Sertifikat, Stempel Tanda Tangan Digital, Validasi Dokumen.
- **Direktori Penting:**
  - `api/index.py`: Entry point serverless/API.
  - `utils/`: Logika pemrosesan (`db.py`, `helpers.py`, `storage.py`).
  - `requirements.txt`: Daftar dependensi Python.

---

## 🌿 2. Git Workflow & Aturan Branching

Kita menggunakan alur kerja terisolasi untuk menghindari konflik antar fitur.

1. **Branch Utama:**
   - `main` / `master`: Branch Produksi (Wajib 100% Stabil).
   - `preview`: Branch Integrasi.

2. **Aturan Branching (WAJIB PER MODUL):**
   - DILARANG mencampur pekerjaan dua modul berbeda dalam satu branch. Setiap pindah modul/fitur, **WAJIB membuat branch baru**.
   - **Format Penamaan:** `<type>/<nama-modul>-<deskripsi-singkat>`
   - *Contoh:*
     - `feat/agenda-qr-scanner` (Fitur baru di modul Agenda)
     - `fix/auth-token-leak` (Perbaikan bug di modul Auth)
     - `refactor/worker-storage-pdf` (Optimalisasi kode di PDF Worker)

3. **Conventional Commits:**
   - Gunakan format: `<type>(<scope>): <pesan>`
   - *Contoh:* `feat(agenda): add payment verification endpoint`

### 🤖 2.1. Aturan Kolaborasi AI (Auto-Commit Trigger)
Untuk mempercepat *workflow* pengembangan bersama AI (seperti di IDE atau Chat):
- Setiap kali pengembang mengetik **"done"** atau **"selesai"**, AI **DIWAJIBKAN** untuk merangkum seluruh perubahan kode yang baru saja didiskusikan/dibuat, lalu menghasilkan draf *Commit Message* sesuai standar Conventional Commits di atas yang siap di-*copy-paste* oleh pengembang.

---

## 💻 3. Standar Penulisan Kode (Coding Guidelines)

### A. Frontend (Nuxt/Vue)
- **Strict TypeScript:** Dilarang keras menggunakan tipe `any`. Selalu buat *Interface* atau *Type*.
- **Data Fetching:** WAJIB menggunakan `useAsyncData` atau `useFetch` untuk pemanggilan API pada saat komponen di-load (SSR) guna mencegah *hydration mismatch*. Hindari `axios` atau `fetch` telanjang kecuali di dalam aksi spesifik (misal: klik tombol).
- **State & Reactivity:** Gunakan `ref()` untuk primitif dan `reactive()` untuk objek. Waspadai hilangnya reaktivitas saat melakukan *destructuring*.

### B. Lokalisasi (i18n) - ZERO HARDCODE
- DILARANG KERAS mengetik teks bahasa apa pun (Indonesia/Inggris/Arab) langsung di file `.vue`.
- Setiap string UI harus disimpan di dalam folder `locales/`.
- Ketika menambahkan kunci (key) baru, Anda WAJIB mengisi terjemahannya di ketiga file JSON secara sinkron (`id.json`, `en.json`, `ar.json`).

### C. Backend (Nitro & Mongoose)
- **Validasi Ketat:** Setiap endpoint di `server/api/` WAJIB memvalidasi body/query (menggunakan Zod/Joi) sebelum memprosesnya ke Database.
- **Kinerja Database:** Hindari **N+1 Query Problem**. Gunakan `.populate()` Mongoose secara efisien di level database, bukan melakukan *looping query* berulang kali di JavaScript. Pastikan field pencarian telah di-indeks.

### D. Python Worker
- Patuhi standar **PEP 8**. Wajib menggunakan *Type Hinting* (contoh: `def process(file: bytes) -> str:`).
- **Manajemen Memori:** Operasi PDF memakan banyak RAM. WAJIB menggunakan *Context Manager* (`with open(...) as f:`) untuk mencegah *memory leak* dan *file lock*.

---

## 🔐 4. Standar Keamanan & Integrasi
- **No Secrets in Code:** Semua token, password, dan *secret key* wajib dimasukkan ke dalam `.env` dan diakses melalui `useRuntimeConfig()` (Nuxt) atau `os.environ` (Python).
- **Sanitasi File:** Unggahan file harus dibatasi ukuran maksimalnya dan divalidasi MIME type-nya sebelum diproses oleh server atau dikirim ke *Worker*.
- **Cross-Service Auth:** Endpoint PDF Worker tidak boleh diekspos publik tanpa lapisan autentikasi. Validasi origin atau gunakan internal API key.

---
*Pelanggaran terhadap dokumen ini dapat mengakibatkan Pull Request ditolak. Patuhi standar untuk memastikan ekosistem HIMATIKA tetap tangguh dan terukur.*