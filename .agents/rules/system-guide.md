---
trigger: always_on
---

# 📜 Pedoman Kontribusi & Standar Rekayasa Perangkat Lunak (HIMATIKA Ecosystem)

Dokumen ini berisi aturan ketat (*strict guidelines*) untuk seluruh kontributor dan pengembang di ekosistem HIMATIKA. Tujuannya adalah untuk menjaga *maintainability*, performa, keamanan, dan skalabilitas sistem jangka panjang.

## 🏗️ 1. Peta Arsitektur Ekosistem
Sistem ini menggunakan arsitektur *microservices* yang terbagi menjadi 3 repositori utama:
1. **`himatika` (Main App & API):** Frontend Nuxt 3 dan Backend Nitro. Bertanggung jawab atas UI/UX utama, autentikasi, database MongoDB (Mongoose), dan logika bisnis (Agenda, Anggota, Berita).
2. **`himatika-docs` (Knowledge Base):** Dibangun dengan Nuxt Content. Murni untuk dokumentasi berbasis Markdown.
3. **`himatika-pdf-worker` (PDF & Signature Engine):** Microservice Python murni. Menangani pembuatan PDF, manipulasi dokumen, dan validasi tanda tangan digital. Dideploy secara *serverless* (Vercel) / Waitress.

---

## 🌿 2. Git Workflow & Branching Strategy

Kita menggunakan modifikasi dari *Git Flow*.
- **`main` / `master`**: Branch produksi. KODE DI SINI HARUS 100% STABIL. JANGAN PERNAH *commit* langsung ke sini.
- **`dev` / `staging`**: Branch integrasi utama. Semua fitur baru bermuara ke sini sebelum rilis.
- **Branch Fitur / Perbaikan**: Buat branch dari `dev` dengan format:
  - `feat/<nama-modul>-<deskripsi>` (contoh: `feat/agenda-qr-scanner`)
  - `fix/<nama-modul>-<deskripsi>` (contoh: `fix/auth-token-expired`)
  - `refactor/<nama-modul>-<deskripsi>` (contoh: `refactor/pdf-worker-storage`)

### Aturan *Commit Message* (Conventional Commits)
Gunakan bahasa Inggris untuk *commit message* agar standar.
- `feat(scope): deskripsi` -> Untuk fitur baru.
- `fix(scope): deskripsi` -> Untuk perbaikan bug.
- `chore(deps): deskripsi` -> Update package/bun.lock.
- `docs(readme): deskripsi` -> Perubahan dokumentasi.
*Contoh:* `feat(worker): add QR code stamping on generated PDF`

---

## 💻 3. Standar Penulisan Kode (Coding Standards)

### A. Nuxt 3 & Vue 3 (Main App)
1. **TypeScript Strict Mode:** Wajib mendefinisikan tipe data (Interfaces/Types). Dilarang keras menggunakan tipe `any` atau ts-ignore (`@ts-ignore`) tanpa persetujuan *maintainer*.
2. **Composition API:** Selalu gunakan `<script setup lang="ts">`. Dilarang menggunakan Options API (data, methods, dll).
3. **Reactivity:** Gunakan `ref()` untuk tipe primitif (string, number, boolean) dan `reactive()` untuk objek/array yang kompleks. Hati-hati dengan *destructuring* dari `reactive` (gunakan `toRefs` jika perlu).
4. **Data Fetching:** 
   - Gunakan `useAsyncData` atau `useFetch` untuk pemanggilan API saat *Server-Side Rendering* (SSR) untuk mencegah *hydration mismatch*.
   - Jangan gunakan `fetch()` atau `axios` standar di dalam komponen Vue kecuali berada di dalam aksi spesifik (seperti `@click`).
5. **State Management:** Gunakan *Composables* (`app/composables/`) untuk state lokal/logika spesifik, dan Pinia (`app/stores/`) HANYA untuk state global yang kompleks (contoh: status user login, preferensi tema).
6. **SSR & Browser API:** Jangan mengakses `window` atau `document` secara langsung di root `<script setup>`. Bungkus di dalam `onMounted()` atau gunakan blok `import.meta.client`.

### B. Lokalisasi / i18n (SANGAT KETAT)
1. **Zero Hardcoded Strings:** TIDAK BOLEH ada teks bahasa apa pun (Indonesia/Inggris/Arab) yang diketik langsung di file `.vue`.
2. **Struktur JSON:** Tambahkan kunci terjemahan di dalam `locales/`. Pastikan kunci tersebut memiliki hierarki yang rapi, contoh:
```json
   // Benar
   { "agenda": { "detail": { "register_button": "Daftar Sekarang" } } }
   // Salah
   { "register_button_agenda_detail": "Daftar Sekarang" }

```

3. **Kewajiban 3 Bahasa:** Setiap kali menambahkan kunci baru di `id.json`, Anda WAJIB menambahkannya juga di `en.json` dan `ar.json` pada lokasi file yang bersesuaian.

### C. Backend (Nitro & Mongoose)

1. **Validasi Input:** Seluruh endpoint di `server/api/` WAJIB memvalidasi body/query menggunakan library validasi (seperti Zod/Joi) sebelum menyentuh database. Jangan langsung menelan data dari *client*.
2. **Mongoose Schema:** Definisikan skema secara ketat. Berikan indeks (`index: true`) pada field yang sering dicari (misal: NIM, Email).
3. **Hindari N+1 Query:** Saat mengambil data berelasi, gunakan `.populate()` secara efisien di level *database*, JANGAN melakukan *looping* query di dalam kode JavaScript.
4. **Error Handling:** Selalu lempar error menggunakan `createError({ statusCode: 400, statusMessage: 'Pesan' })` agar ditangkap dengan baik oleh Nuxt frontend.

### D. Python (PDF Worker)

1. **PEP 8:** Patuhi standar format kode Python (gunakan formatter seperti *Black* atau *Flake8*).
2. **Type Hinting:** Semua argumen fungsi dan nilai kembalian WAJIB memiliki *type hint* (contoh: `def generate_pdf(data: dict) -> str:`).
3. **Manajemen Memori:** Pemrosesan PDF rentan terhadap kebocoran memori (*memory leak*). Pastikan semua file *stream* atau koneksi PDF ditutup menggunakan *context manager* (`with open(...) as f:`).
4. **Pemisahan Logika:** Endpoint API hanya boleh berada di `api/`. Logika pembuatan PDF, koneksi database, atau interaksi file system HARUS dipisah ke dalam modul di `utils/`.

---

## 🔐 4. Standar Keamanan (Security)

1. **Data Sensitif:** JANGAN PERNAH meletakkan *Secret Key*, *Password*, atau *Token API* di dalam kode. Selalu gunakan variabel lingkungan (`.env` dan `useRuntimeConfig()` di Nuxt, atau `os.environ` di Python).
2. **Komunikasi Antar Service:** Panggilan dari `himatika` (Main App) ke `himatika-pdf-worker` harus divalidasi. Jangan biarkan endpoint worker terbuka untuk publik tanpa semacam *API Key* atau otorisasi.
3. **Sanitasi File:** Jika ada fitur upload dokumen/gambar, WAJIB validasi *MIME type* dan ukuran maksimal file di sisi server sebelum diunggah ke *Storage* (`utils/storage.py` atau Nuxt server).

---

## ✅ 5. Aturan Pull Request (Definition of Done)

Sebelum meminta *Code Review* pada *Pull Request*, pastikan Anda sudah mengecek daftar berikut:

* [ ] Kode sudah diuji dan berjalan normal di *local environment*.
* [ ] Tidak ada error atau *warning* pada konsol terminal maupun browser.
* [ ] Semua teks baru sudah dimasukkan ke sistem i18n (3 bahasa).
* [ ] *Codacy* (atau linter lainnya) menunjukkan indikator hijau / lulus.
* [ ] Jika ada perubahan pada struktur *Database*, jelaskan di deskripsi PR.
* [ ] Jika menambah *package* baru (di `package.json` atau `requirements.txt`), berikan alasan yang kuat di deskripsi PR.

Pelanggaran berulang terhadap pedoman ini dapat menyebabkan *Pull Request* Anda ditolak tanpa peninjauan lebih lanjut.