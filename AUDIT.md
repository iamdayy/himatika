# Laporan Audit Komprehensif — Himatika Platform

> Audit read-only terhadap seluruh subsistem: auth/session, agenda/event, pembayaran, kriptografi & tanda tangan digital, storage/upload, model database, frontend, i18n, infrastruktur, dan testing.
> Semua temuan diverifikasi dengan membaca kode (file:line). Item yang belum 100% terverifikasi ditandai **[unverified]**.
> Tanggal audit: Agustus 2026 · Branch dasar: `preview`

---

## Ringkasan Eksekutif

| Domain | Kritis | Tinggi | Sedang | Rendah |
|---|---|---|---|---|
| Auth, sesi & OTP | 1 | 6 | 8 | 5 |
| Agenda & pendaftaran | 3 | 5 | 11 | 4 |
| Pembayaran | 2 | 2 | 6 | 2 |
| Kripto & tanda tangan digital | 1 | 3 | 5 | 4 |
| Storage & upload | 0 | 2 | 5 | 2 |
| Model & query DB | 2 | 5 | 8 | 4 |
| Frontend & i18n | 0 | 6 | 13 | 11 |
| Infrastruktur & config | 0 | 3 | 4 | 2 |
| Testing & repo hygiene | 0 | 4 | 2 | 3 |
| **Total (setelah dedup)** | **9** | **36** | **62** | **37** |

**Top 10 prioritas remediasi (urutan dampak × kemudahan):**

1. `POST /api/agenda/[id]/payment/verify` tanpa otorisasi — user mana pun bisa memverifikasi pembayarannya sendiri (**bypass pembayaran total**) — §2.1
2. `PUT /api/member/email` IDOR → rantai account takeover — §1.1
3. Kuota event tidak pernah ditegakkan (dead code) + race condition — §2.2
4. Dump PII publik semua peserta agenda via whitelist prefix GET — §2.3
5. Webhook Midtrans bisa men-downgrade peserta yang sudah bayar menjadi canceled + hapus data — §3.1
6. `PUT /api/doc/[id]` bisa mengganti URL dokumen apa pun → integritas tanda tangan digital hancur — §4.1
7. Endpoint buat berita & komentar berita rusak total (ValidationError setiap kali dipanggil) — §6.1–6.2
8. SSRF open proxy `/api/storage/proxy?url=` — §5.1
9. Kode OTP disisipkan ke URL attacker-controlled di email resmi (phishing) — §1.2
10. Rate limiter `lruCache` per-instance di Vercel = brute-force protection nominal — §8.1

---

## 1. Autentikasi, Sesi & OTP

### KRITIS

**1.1 Change-email IDOR → Account Takeover penuh**
- File: `server/api/member/email/index.put.ts:8-55`
- Otorisasi murni bergantung pada query param `token` yang dicocokkan ke `UserModel.token` — field yang **tidak pernah diisi di mana pun** (hanya `token: ""` di `auth/magic/verify.get.ts:59-60`).
- Token `undefined`/kosong membuat filter Mongoose cocok dengan **user pertama di DB**. Endpoint mengabaikan `event.context.user`; tidak ada cek kepemilikan; tidak ada cek unique email baru.
- Rantai serangan: ganti `member.email` korban → minta OTP "Reset Password" ke email milik penyerang → `/api/reset-password` → **takeover akun siapa pun** hanya dengan sesi biasa.

### TINGGI

**1.2 Kode OTP dieksfiltrasi via parameter `link` (phishing dari email resmi)**
- `server/api/otp/generate.post.ts:23,84` — `link: z.string().min(1)` divalidasi minim lalu digabung: `` `${public_uri}${link}&code=${code}&expiresAt=...` `` dan dirender sebagai tombol email (`mailTemplate.ts:132`, tak di-escape).
- Penyerang submit NIM+email korban dengan `link: https://evil.com/?...` → korban menerima email OTP resmi yang tombolnya menuju situs penyerang **dengan kode valid di query string**. Endpoint ini publik (whitelist `/api/otp`).

**1.3 Signout memungkinkan penghapusan massal sesi korban (DoS)**
- `server/utils/Sessions.ts:161-180` — `jwt.decode()` **tanpa verifikasi signature** pada branch accessToken, lalu `SessionModel.deleteMany({ user: decoded.user })`.
- `/api/signout` ada di whitelist (`auth.ts:15`). Payload JWT palsu `{"user":"<id korban>"}` cukup untuk mencabut semua sesi korban.

**1.4 Refresh token tidak dirotasi; pencabutan sesi tidak efektif**
- `Sessions.ts:29-37` — `refreshSession` mengembalikan refresh token yang sama (valid 90 hari); tidak ada rotasi/reuse-detection/metadata device.
- `checkSession` hanya `SessionModel.exists({ user })` → access token lama tetap lolos selama ada satu baris sesi mana pun. Logout tidak mematikan access token lain.

**1.5 OTP tidak pernah dikonsumsi; tanpa batas percobaan**
- `server/api/otp/verify.post.ts:38-89` — kode benar bisa direplay sampai TTL (10 menit); token HMAC hasil `generateToken(email, code, type)` bisa dicetak ulang; tidak ada attempt-counter; komparasi `===` biasa (bukan constant-time).

**1.6 Log audit bisa dibaca semua user terautentikasi**
- `server/api/audit.get.ts:3-21` — komentar TODO mengakuinya: *"Ensure user is admin or organizer"* tapi hanya cek `event.context.user`. Member biasa bisa melihat riwayat login + IP semua user.

**1.7 Perubahan kredensial tidak mencabut sesi**
- `password/index.post.ts:47-54`, `reset-password/index.post.ts:73-75` — setelah reset password, semua access token (60 mnt) dan refresh token (90 hari) lama tetap hidup. Attacker dengan sesi curian bertahan melewati rotasi kredensial.

### SEDANG

**1.8 Anti-enumeration OTP jebol oleh side-channel 429 + mail bombing** — `otp/generate.post.ts:44-71`: member asli dapat 429 saat minta OTP kedua, non-member selalu 200. 7 tipe OTP × korban = email bombing. Link email juga tak tervalidasi (lihat 1.2).

**1.9 Reset-password tanpa Zod; error dilempar sebagai HTTP 200** — `reset-password/index.post.ts:11-31,80-86`: catch-all me-resolve error jadi body `{statusCode: undefined}`; lookup OTP hanya by `code` tanpa email; expiry bergantung penuh pada TTL monitor Mongo (~60 dtk lag).

**1.10 Cookie auth tanpa `httpOnly`; `SameSite=None` di produksi** — `auth/magic/verify.get.ts:118-128`, `auth/google/callback.get.ts:56-65`, `nuxt.config.ts:367-390`. Token akses + refresh 90 hari terbaca XSS apa pun; amplifikasi ke takeover persisten.

**1.11 OAuth Google tanpa `state`/PKCE** — `googleAuth.ts:31-38`. Login CSRF: korban bisa diam-diam login ke akun milik attacker.

**1.12 Magic link: enumerasi + password `Math.random()` + replayable** — `magic/request.post.ts:40-44` (404 "Email not found" = oracle), `magic/verify.get.ts:51-68` (auto-create user `verified:true` dengan password xorshift128+, tanpa `validatePassword`; token 15-menit multi-use).

**1.13 Signin tidak mengecek status member** — `signin.post.ts:79-97`: populate member **tanpa** filter status (menimpa autopopulate schema); member `inactive`/`deleted` tetap bisa login penuh dengan klaim organizer.

**1.14 Whitelist prefix terlalu luas + entri fantom** — `auth.ts:9-28`: `/api/signup` tidak eksis (registrasi di `/api/register` — coverage ilusi); prefix `/api/agenda`, `/api/payment` GET mengecualikan seluruh subtree (lihat §2.3, §3.5).

**1.15 Registrasi TOCTOU** — `register.post.ts:40-50,132-140`: cek username/email check-then-act → E11000 generic 500; akun belum-verifikasi bisa ditimpa username/password-nya oleh siapa pun yang tahu NIM+email.

**1.16 Error mentah bocor di jalur auth** — `authHelper.ts:57`, `Sessions.ts:129-131` (`error.message` ke klien), `sign/verify/index.post.ts:53-57` (`data: error`).

### RENDAH

- **L1** `TokenHelper.verifyToken` melempar `RangeError` saat buffer hex beda panjang (`timingSafeEqual`) alih-alih return false — `TokenHelper.ts:46-51`.
- **L2** Verifikasi akun menerima OTP tipe apa pun & menghapus dokumen OTP yang salah — `user/verify.post.ts:49-104`.
- **L3** Placeholder `JWT_SECRET=your-jwt-secret-here` lolos validasi boot — `.env.example:12`, `Sessions.ts:7-13`.
- **L4** Enumerasi: `member/email/index.get.ts` memberi email+username member belum-verifikasi by NIM ke user mana pun; `/api/ip` mempercayai `x-forwarded-for`.
- **L5** Klaim JWT basi: role organizer berubah hanya efektif setelah expiry token (60 mnt) — `auth.ts:36-37`.

---

## 2. Agenda & Sistem Pendaftaran

### KRITIS

**2.1 Verifikasi pembayaran manual tanpa otorisasi (tiket gratis)**
- `server/api/agenda/[id]/payment/verify.post.ts:7-49` — **tidak ada** `ensureCommitteeOrOrganizer` maupun cek kepemilikan (bandingkan `pay.put.ts:29` yang benar). User terautentikasi mana pun: daftar event berbayar → buat charge `manual_transfer` → POST sendiri `{"registeredId": "<id>", "status": "success"}` → status sukses, e-ticket terkirim via QStash/WAHA. Juga bisa mensabotase registrasi orang lain.

**2.2 Kuota event = dead code; quota tidak pernah ditegakkan**
- `participant/register/index.post.ts:98-106` mengecek `agenda.quota`, padahal `AgendaModel` **tidak punya field `quota` top-level** (satu-satunya `quota` ada di `configuration.ticketModels`, line 134). Strict mode Mongoose membuat `agenda.quota` selalu `undefined` → blok never executes. Test regresi `agenda-quota.test.ts` pasti gagal — dan tidak pernah jalan di CI (§9.1).
- Bahkan jika field ada: pola `countDocuments`-check-then-insert = race overbook. Quota per ticket-model juga tidak ditegakkan di mana pun.

**2.3 Dump PII publik semua peserta**
- `participant/index.get.ts:26-71` + whitelist prefix GET `/api/agenda` (`auth.ts:22-31`). Tanpa satu pun cek internal: siapa pun di internet bisa list nama, NIM, email, jawaban form semua peserta/peserta panitia agenda apa pun (`perPage=0&page=0` = tanpa batas). `_id` peserta yang bocor menjadi amunisi untuk 2.1, 2.7, dan pemalsuan QR (§4.2).

### TINGGI

**2.4 Boolean salah di bulk-committee** — `committee/register/batch/index.post.ts:9-14`: `!user && !organizer` seharusnya `||` → user non-organizer lolos dan bisa bulk-set `payment.status=success` (metode cash).

**2.5 Batch update peserta tanpa filter `agendaId`** — `participant/register/batch/index.post.ts:29`: panitia agenda A bisa flip status peserta agenda B (ObjectId bocor publik via 2.3). Versi committee sudah benar menambahkan `agendaId`.

**2.6 QR tiket unsigned & reusable** — `utils/qrcode.ts:8-17`, `[id]/scan.post.ts:12-84`: payload hanya `{id, role}` ObjectId tanpa HMAC/nonce; id bocor massal (2.3); scan pakai read-modify-`save()` non-atomik (dua scanner racing sama-sama sukses); QR cetakan bisa check-in orang lain prematur (DoS kehadiran).

**2.7 Guest bypass semua aturan eligibility** — `participant/register/index.post.ts:83-93` (komentar *"Bypass permission check for guest registrations"*): event `canRegister: None/Member/Organizer` tetap menerima tamu anonim; window `canRegisterUntil` hanya dicek utk member.

**2.8 Hijack email guest participant** — `participant/register/[registeredId]/email.put.ts:6-37`: tanpa cek kepemilikan; `GuestModel.email` unique & shared lintas partisipasi → ubah email = rampas semua konfirmasi/tiket + mematahkan cek email di `verify.post.ts:32`.

### SEDANG

- **M1** Window pendaftaran tidak ditegakkan bila hanya `end` yang diisi — `AgendaModel.ts:553-559,617-623` (butuh kedua start&end); tidak ada cek terhadap `date.end` event.
- **M2** `payment.amount`/`biller_code` dibuang strict mode (tidak ada di `paymentSchema`) → e-ticket "Rp 0", invoice tanpa nominal, queue verifikasi tanpa jumlah — `payment/index.post.ts:119,206` vs `AgendaModel.ts:60-100`, `types/index.ts:264-265`.
- **M3** Charge creation tanpa cek kepemilikan `registeredId` + `payment_method` klien tidak divalidasi terhadap `allowedPaymentMethods` — `payment/index.post.ts:41-66,161-185` (+ versi committee tanpa guard `status_code`).
- **M4** `order_id = registeredId` dipakai ulang tiap retry → Midtrans menolak charge kedua [unverified perilaku persis]; parser webhook `split(":")[0]` mengantisipasi format suffix yang tak pernah diproduksi — `notification.post.ts:21`.
- **M5** Idempotensi settlement webhook read-check-write → duplikasi email/e-ticket saat redelivery paralel — `notification.post.ts:54-76`.
- **M6** Race kuota jabatan panitia + label `job` fabrikasi bebas melewati validasi & kuota — `committee/register/index.post.ts:79-113`.
- **M7** Lookup tiket rusak: `registered.get.ts:25-43` `findOne({agendaId})` tanpa filter user (semua kecuali pendaftar pertama dapat 403); `registered/[registeredId]/index.get.ts:26` memanggil `isRegisterdById` yang **tidak eksis di model** dan tidak di-await → TypeError 500.
- **M8** Response personal di-cache by URL → kebocoran lintas user: `nearest/index.get.ts:4-57` (`maxAge:600, swr`) menyajikan exclusion-set user pertama ke semua; `agenda/index.get.ts:13` cache `myParticipant`/role-gated visibility keyed pathname saja (diverifikasi thd source nitropack).
- **M9** Self check-in tanpa gate waktu/pembayaran — `[id]/attend/index.post.ts:52-73`: peserta belum bayar bisa absen diri kapan pun; statistik kehadiran & sertifikat korup; inkonsisten dengan `scan.post.ts` (`visitTime` vs tidak).
- **M10** Akses anonim data registrasi penuh cukup dengan ObjectId: `participant/me.get.ts:34-36` (param `?participantId=`), `participant/[participantId]/meet.get.ts:16-53` (redirect Zoom berbayar).
- **M11** Question builder terbuka utk user mana pun + answer collector tanpa scoping agenda, error dalam `forEach(async…)` hilang setelah response 200 — `participant/question/**`.

### RENDAH

- **L1** Pagination in-memory + `Number(undefined)=NaN` + `$regex` tak di-escape (ReDoS) — `participant/index.get.ts:26-61`, `agenda/index.get.ts:42-51`.
- **L2** Masking PII no-op karena populate tak pernah dilakukan (`delete p.member.email` pada ObjectId) — `[id]/index.get.ts:72-109`.
- **L3** `CommitteeModel.ts:49-53` default object literal + `Date.now()` dievaluasi sekali saat module load.
- **L4** `ticket/make.post.ts` membuat PDF tiket dari body 100% klien (agenda/participant/amount/role) — tiket palsu realistis.

---

## 3. Pembayaran (Midtrans)

### KRITIS

**3.1 Webhook failure-branch men-downgrade peserta yang sudah bayar & menghapus datanya**
- `payment/notification.post.ts:136-175`: branch `cancel/expire/deny` melakukan update **tanpa guard** status `success` (guard idempotensi hanya ada di branch success, line 65). Redelivery/out-of-order notification: settlement diproses → `expire` telat datang → status jadi `canceled`, dan untuk guest **baris partisipasi dihapus permanen** beserta dokumen Guest-nya — padahal uang sudah masuk.
- Tidak ada verifikasi bahwa `gross_amount` cocok dengan amount tersimpan (signature hanya membuktikan asal Midtrans).

**3.2 Cancel transaksi settled secara lokal (412 = sukses)**
- `payment/index.delete.ts:58-76`: Midtrans menjawab `412` (already settled) dan kode menerimanya sebagai keberhasilan cancel → status lokal `canceled`, `order_id`/`transaction_id` dikosongkan. Uang terkumpul, peserta tertanda belum bayar, jejak audit terhapus.

### TINGGI

**3.3 Workflow verifikasi manual transfer rusak (state machine mismatch)** — `proof.post.ts:75-81` set `status:"verifying"`, tapi `verify.post.ts:25,34` hanya match `'pending'` → approval proof yang sah **mustahil** ("Could not verify payment"); sebaliknya jalur langsung `pending→success` (§2.1) melewati review bukti.

**3.4 Public GET `/api/payment` melakukan lookup Midtrans + write DB dari input anonim** — `middleware/auth.ts:27` + `payment/index.get.ts:8-33`: siapa pun bisa poll status transaksi arbitrer dan memicu write status lokal (jalur sinkron tak bertanda tangan di samping webhook), plus `error.message` bocor ke anonim.

### SEDANG

- **M1** Idempotensi webhook TOCTOU (duplikasi efek samping) — `notification.post.ts:54-76`.
- **M2** `getTransactionStatus` memetakan status tak dikenal (`deny`, `capture`, dll) ke `"pending"` → polling bisa menghidupkan kembali status — `midtrans.ts:102-115`.
- **M3** Committee charge tanpa guard `status_code` gagal → overwrite `transaction_id: undefined` — `committee/register/[registeredId]/payment/index.post.ts:151-166`.
- **M4** Order-id reuse (lihat §2-M4).
- **M5** `error.message` mentah ke klien di beberapa handler pembayaran.
- **M6** Payment-proof upload tanpa cek kepemilikan + MIME client-declared — `proof.post.ts:12-81`.

### RENDAH
- **L1** Error laundering: catch-all mengubah 404-nya sendiri jadi 500 — `payment/index.get.ts:43-50`.
- **L2** `sse.ts` infrastruktur SSE in-memory mati di Vercel; call-site satu-satunya dikomentari — `utils/sse.ts`.

---

## 4. Kriptografi & Tanda Tangan Digital

### KRITIS

**4.1 `PUT /api/doc/[id]` — siapa pun bisa mengganti URL dokumen (string arbitrer)**
- `doc/[id]/index.put.ts:16-45`: hanya butuh login; `body.doc` string bebas menimpa `doc.doc` **tanpa cek uploader/organizer**, bahkan setelah dokumen ditandatangani. Efek: tampilan tanda tangan & `/api/sign/verify` menempel pada file milik attacker; plus delete (`index.delete.ts:54` → `deleteFromR2(doc.doc)`) dapat menghapus objek bucket lain.

### TINGGI

**4.2 Signature menandatangani hash client-supplied terpotong 8 hex karakter**
- `app/pages/signatures/[id].vue:54-59` memotong SHA-256 ke 8 char (~2³²); `sign/index.post.ts:16-17,63-69` menerima `data` apa pun dari klien **tanpa menghitung ulang** hash PDF tersimpan. RSA-2048 terikat pada hampir tidak ada → collision/binding attack praktis.

**4.3 `/api/sign/verify` publik membocorkan seluruh dokumen + PII semua penanda tangan**
- `sign/verify/index.post.ts:8-50` (whitelisted): autopopulate `SignModel`/`DocModel` membawa NIM, email, avatar, blob signature base64, trails — cukup satu string signature (dari QR) untuk memanen semuanya.

### SEDANG

- **M1** `/api/storage/webhook-media`: service-token media worker **selalu 401** (`checkSession` menolak token tanpa claim user/guest — `Sessions.ts:22-27`) → video stuck `processing`; paradoksnya user biasa bisa POST `processedUrl` arbitrer (content injection) — `webhook-media.post.ts`.
- **M2** `/api/enscryption/*` tanpa role gate: GET mengembalikan private-key material (terenkripsi), POST keygen RSA-2048 sinkron in-request (CPU DoS murah), DELETE merusak signing; typo `statusCode: 20` — `enscryption/*`.
- **M3** HTML injection ke email branded: `mailTemplate.ts` tidak meng-escape `contentParagraph*`, detail agenda, dan field link/URL — string terkontrol organizer/member masuk ke email domain Resend resmi.
- **M4** Upload mempercayai Content-Type deklarasi klien; ekstensi diturunkan darinya; tanpa magic bytes — `customReadMultipartFormData.ts:92-100`, `storage.ts:61-66` (hosting payload phishing di domain publik organisasi).
- **M5** Presigned-video finalize menerima `fileKey` arbitrer tanpa membuktikan issuance — `agenda/[id]/video/index.post.ts:46-66`.

### RENDAH
- **L1** Tanpa timeout di semua call eksternal (Midtrans/WAHA/PDF worker) — hang → exhaust function Vercel.
- **L2** `DocModel.post("save")` mengirim email ke SEMUA signer di SETIAP save (spam + burn kuota Resend) — `DocModel.ts:132-170`; `post("findOneAndUpdate")` mengevaluasi dokumen pre-update (stale).
- **L3** `signedIp: ""` / `actionIp: ""` placeholder mengosongkan jejak audit tanda tangan — `sign/index.post.ts:116,124`.
- **L4** Signature lookup by exact base64 → QR = capability; signature reuse antar dokumen tidak dicegah (S4, [unverified skenario penuh]).

---

## 5. Storage & Upload

### TINGGI

**5.1 Open SSRF proxy** — `storage/proxy.get.ts:1-13`: `GET /api/storage/proxy?url=<bebas>` tanpa validasi scheme/host/IP; user terdaftar (termasuk guest self-service) bisa membaca metadata cloud internal (`169.254.169.254`), localhost:27017, dsb. Ada hanya demi workaround CORS R2 untuk halaman signatures.

**5.2 `extractKeyFromUrl` membuang host sepenuhnya** — `storage.ts:29-46`: URL tersimpan apa pun menjadi key hapus-hapus bucket; dirantai dengan 4.1/M1/M5 = penghapusan objek arbitrer. Keys predictable (`uploads/<folder>/<timestamp>_<name>`).

### SEDANG
- **M1** webhook-media double-flaw (lihat §4-M1).
- **M2** Presigned finalize arbitrary fileKey (lihat §4-M5).
- **M3** Proof upload tanpa kepemilikan (lihat §2/§3).
- **M4** MIME sniffing absen (lihat §4-M4).
- **M5** Limit kontradiktif: legacy video 20 MB vs global requestSizeLimiter 10 MB; multipart default 2 MB diam-diam berbeda dari ekspektasi caller — `video/index.post.ts:110`, `nuxt.config.ts:288`.

### RENDAH
- **L1** `hashText.ts` dead code bernama keliru (concat timestamp+UUID, bukan hash).
- **L2** `runtimeConfig.vercelBlobToken`/`storageDir` mati — sisa Vercel Blob, tidak dipakai `server/**`/`app/**` (grep).

---

## 6. Model Database & Modul API Lain

### KRITIS

**6.1 `POST /api/news` rusak: omit field required `tags`**
- `news/index.post.ts:70-84` tidak menyertakan `tags`; `NewsModel.ts:79-82` `required: true` tanpa default → `ValidationError` (500) **setiap kali** endpoint dipanggil. *(Diverifikasi statis; belum dieksekusi runtime.)*

**6.2 `POST /api/news/[id]/comments` rusak total: field salah**
- `comments/index.post.ts:14-17` menulis `{content, news}` padahal `CommentModel` skemanya `{body(required), author, likes}` → strict mode strip → ValidationError selalu. **Komentar tidak pernah bisa dibuat.**

### TINGGI

- **T1** Mass assignment melanggar konvensi repo sendiri: `new MemberModel(body)` (`member/index.post.ts:31`), `MessageModel.create({...body})`, `CarouselModel.create(body)`, `config updateOne({_id}, body)`, `ProjectModel spread body`, `member/batch insertMany` tanpa cap ukuran.
- **T2** Cache poisoning by-path: `news/index.get.ts:126-131`, `project/index.get.ts:80-121`, `photo/index.get.ts:91-97` — draft/archived konten organizer ter-cache dan disajikan ke anonim pada URL yang sama.
- **T3** Identitas aspirasi "anonim" bocor di branch single-item (`aspiration/index.get.ts:57-77` — `from` autopopulated meski `anonymous`).
- **T4** `PUT /api/member/profile` silent no-op: Zod parse flat (`village/district/...`) tapi schema nested di `address.*`/`birth.place` → strict mode strip → 200 "updated" tanpa efek. Test regresi `member-profile.test.ts:62-67` kontradiksi dengan model = bukti drift test↔model.
- **T5** Regex injection/ReDoS via `search` di 7 endpoint (news, member, aspiration, project, photo, video, public).

### SEDANG

- **M1** Stale `new Date()` di module-load untuk virtual organizer (`MemberModel.ts:383-442`) → `event.context.organizer` (dipakai otorisasi banyak endpoint) bisa keliru pada proses berumur lama.
- **M2** NIM type mismatch: `Number` di Member/Guest/OTP vs `signerNIM: String` (`AgendaModel.ts:263`) → lookup `findMemberByNim` sertifikat selalu miss.
- **M3** Dead text-index pada field tak eksis (PhotoModel/VideoModel `title/description`) + allowlist `validateQueryParams.ts` referensi field tak eksis (sort/filter silent no-op).
- **M4** Guard `OverwriteModelError` hilang di EncryptionModel & OrganizerModel (25 model lain benar).
- **M5** `UserModel` pre-save bcrypt menelan error (`return error` bukan throw) → risiko save lanjut tanpa hashing — `UserModel.ts:210-219`.
- **M6** Index hilang di hot path: News `published/publishedAt`, Project, PointLog.member, Message.archived, Doc.uploader/no; `Category.slug` tidak unique (beda dengan News.slug).
- **M7** Autopopulate berlebihan di UserModel (projects/agendas/aspirations/organizer-transforms di **setiap** fetch user termasuk jalur auth middleware).
- **M8** Duplikasi schema mati dalam `AgendaModel.ts:353-448`; ekspresi invalid `{ type: String || [String] }` (NewsModel/CommentModel); ConfigModel pre-save destruktif race-prone; cascade post-save signature salah (`MemberModel.ts:480-500`).

### RENDAH
- **L1** Guest sessions crash 7 endpoint (`user.member.NIM` tanpa null-guard → TypeError 500): aspiration post/get/delete/vote, achievement claim, member delete/put.
- **L2** Likes berita: race toggle + dedupe by `x-forwarded-for` spoofable — `news/[id]/likes/index.post.ts:27-50`.
- **L3** Slug regenerasi tiap edit mematikan URL lama + E11000 mentah — `news/index.put.ts:77-80`.
- **L4** N+1 loop `findOne` per-NIM (`getAuthorsIds`/`getIdByNim`); project POST bisa dibuat member mana pun (inkonsisten dgn put/delete organizer-only); member self-delete cascade permanen.

---

## 7. Frontend & i18n

### TINGGI

- **T1** Race condition route guard panitia: `app/middleware/committee.ts` memakai `useFetch` **tanpa await** → `agenda.value` undefined saat `isCommittee.value` dibaca → guard salah abort/izinkan; guard juga return-early di server (proteksi murni client-side). Mengawal 6 halaman admin.
- **T2** Stepper menghancurkan state validasi: deep-watch `props.steps` (computed berisi formData reaktif) → `resetAllValidation()` tiap keystroke; bookkeeping by index array sementara steps berubah bentuk — `components/core/Stepper.vue:166-173,666-668`.
- **T3** XSS sink di print nametag admin: interpolasi `fullName` (kontrol guest self-register) ke `innerHTML` iframe cetak — `administrator/agendas/[id]/participant/index.vue:362-395`.
- **T4** Pinia stats store tidak pernah di-reset saat logout → user B melihat profil/points/aspirasi user A — `stores/useStatsStore.ts` (grep: tidak ada reset; signOut handlers kosong).
- **T5** File locale korup: `locales/pages/agendas-id-register/en.json` **0 byte**; `$ts('check')`, `$ts('no_agenda_yet')`, `$ts('no_project_yet')` merender key mentah ke layar (plugin mengembalikan key saat missing).
- **T6** Hydration mismatch homepage SSR: shuffle `Math.random()` di computed — `app/pages/index.vue:38-44` (+ grouping bulan `toLocaleString` TZ-dependent di `agendas/index.vue:117-133`).

### SEDANG

- **M1** Pelanggaran sistemis zero-hardcode: **±572 string literal UI** (prop) — administrator ±199, Modals ±146, agendas ±80, dashboard ±43; halaman guest/dashboard.vue 100% hardcoded; campuran EN/ID dalam satu komponen.
- **M2** Bare `$fetch('/api/ip')` top-level setup di halaman SSR — `news/[slug].vue:17`; payment/detail.vue pakai `$fetch` mentah (bypass `$api` refresh-retry).
- **M3** Filter "Hanya berbayar/gratis" mati (state tak pernah masuk query API) — `agendas/index.vue:64-65,36-48`.
- **M4** Hasil validasi NIM kosong dibuang (tanpa `return`) — `register.vue:205-211`.
- **M5** Mutasi getter-only `reactiveComputed` `formSelectPayment` → pilihan metode/bank bisa revert sebelum submit — `participant/register.vue:232-243,918,963`.
- **M6** Static `useAsyncData` keys dipakai lintas route dinamis ('admin-agenda-detail' di 5 page) → data agenda lama sampai refetch.
- **M7** Row selection by posisi index bertahan lintas refetch/pagination → operasi batch menyasar baris yang salah — `participant/index.vue`.
- **M8** `const payment = ref(props.payment)` copy-once stale + prop mutation — `payment/detail.vue:285,324`.
- **M9** Toast sukses untuk failure (copy-paste swap) — `participant/index.vue:591`; empty-state copy "panitia" di tabel peserta (:711); `statusCode` truthiness dianggap sukses — `news/[slug].vue:60,80,94`.
- **M10** `en.json` 192/495 key identik dgn id (banyak masih Indonesia); 10 key hanya ada di id.json; key typo `failed_to_setyment_status` dengan teks EN di file id.
- **M11** Total bayar ringkasan memasukkan biaya admin, kartu PaymentDetail tidak (inkonsistensi tampilan uang).
- **M12** Duplikasi modal Add/Edit besar (news 244/254 lines, organizer 442/460); 4 komponen >800 baris (create.vue 1306, edit.vue 1240, register.vue 1083, profile 902).
- **M13** `handleVerify` silent-failure (tanpa toast/refresh saat non-200) — `payments-verification.vue:44-47`.

### RENDAH
- **L1** `new Date(undefined!) || new Date()` — Invalid Date truthy → fallback tak pernah jalan — `profile/index.vue:107,145`.
- **L2** 143 `v-for` keyed-by-index; `toLocaleDateString()` tanpa locale di 4 file (hydration risk).
- **L3** Draft PII registrasi persisten di localStorage lintas logout — `register.vue:140-151`.
- **L4** `console.log` sisa debug 7× termasuk flow kredensial (`login.vue:95-108`, `register.vue:258`).
- **L5** `OTPHelpers.ts` memanggil `useRouter()` di module scope (file tampaknya tak terpakai); duplikat konstanta identik di create.vue; `password="placeholder"` hack validasi di login.
- **(Catatan desain)** Cookie `agenda-participant-${id}` 30 hari berisi participantId mentah = capability URL; gabungan dengan §2-M10 berarti kepemilikan GUID = akses.

---

## 8. Infrastruktur & Konfigurasi

### TINGGI

- **T1** Rate limiter driver `lruCache` (per-instance memory) di deploy Vercel serverless → limit efektif × jumlah instance; brute-force protection nominal — `nuxt.config.ts:290-296` + rule per-route :79-132. Upstash sudah jadi dependency tapi tak dipakai untuk ini.
- **T2** CSP `img-src` memuat `http:` dan `https:` (= izinkan gambar apa pun, mixed content) — `nuxt.config.ts:274-281`.
- **T3** Blanket CORS `/api/*` dengan header `PUBLIC_URI` mentah (unset → literal `"undefined"`); layering nuxt-security CORS + header manual rapuh — `nuxt.config.ts:140-148`.

### SEDANG
- **M1** Cakupan `routeRules` xss/csrf tidak konsisten: message, aspiration, doc, upload/image, photo, video, carousel, organizer, member/avatar|batch|profile menerima teks/upload tanpa exception (kebijakan "copy pattern" tidak diterapkan merata).
- **M2** Double caching `/api/stats`: SWR 15 mnt (routeRules) + handler cache 24 jam → staleness hingga ~24 jam — `stats/index.get.ts:31-35`.
- **M3** `pwa.devOptions.enabled: true` semua environment.
- **M4** RuntimeConfig mati: BLOB keys (lihat §5-L2).

### RENDAH
- **L1** README kontradiksi faktual: Mailtrap vs Resend aktual (`mailer.ts`), instruksi npm/pnpm vs bun-only, NEXTAUTH_URL/SUPER lama, klaim pdf-lib/exceljs tak ada di package.json, klaim locale `ar`.
- **L2** Dockerfile merujuk `vercel.json` yang tidak eksis.

---

## 9. Testing & Kebersihan Repo

### TINGGI

- **T1** CI hanya menjalankan `test:e2e`; **seluruh `tests/server/**` (12 file regresi: race-condition, quota, webhook, signature, dll) tidak pernah jalan di CI** — `.github/workflows/e2e.yml:45`.
- **T2** `tests/nuxt` tidak eksis → `bun run test:nuxt` match nol file (exit non-zero).
- **T3** Test tautologis: `checkout.test.ts` — 4× `waitForSelector(...).catch(() => {})` + assert konten dari HTTP mock + `expect(true).toBe(true)`; assertion login/register bergantung substring localized ('salah', 'berhasil') rapuh.
- **T4** Drift test↔model terkonfirmasi: `member-profile.test.ts` mengasumsikan schema flat yang sudah tidak ada (harus merah); `payment-webhook.test.ts:31` seed `method:'midtrans'` yang melanggar enum schema [unverified eksekusi].

### SEDANG
- **M1** Setup bersama meng-wipe DB (User/Member/Category/Agenda) untuk SEMUA project vitest — `NUXT_MONGODB_URI` yang salah arah = data lenyap.
- **M2** Debris ter-commit: `vitest_out.txt`, `tests/find_unused_fields.js` (hardcoded absolute path), `single_usage_fields.json`, `find_missing_docs.cjs`, `id_keys.json` kosong, script ad-hoc `add-dummy/mock/test-seminar`.

### Coverage gap — flow kritikal TANPA test sama sekali
Berita (create/edit/publish/komentar/like), manajemen member tulis + batch import, reset/change password & OTP, magic-link + Google OAuth, tanda tangan digital end-to-end, aspirasi (submit/vote/anonimitas), achievement claim→approval, proyek/galeri CRUD + publish gating, **matriks otorisasi organizer-vs-member-vs-guest** (akar dari §1.6, §2.1, §2.4, §6-L1), rate limiting/CORS/CSP, leaderboard.

---

## Temuan Positif (sudah benar)

- AES-256-GCM benar: IV acak 12-byte, auth tag, validasi key 32-byte — `encrypt.ts`.
- Webhook QStash terautentikasi `Receiver.verify` fail-closed.
- Webhook Midtrans verifikasi SHA-512 + `timingSafeEqual` sebelum mutasi.
- Password bcrypt cost 10 via pre-save hook; `validatePassword` dipanggil di jalur register/reset/change utama.
- JWT HS-family saja (tanpa algorithm confusion); tidak ada secret di `runtimeConfig.public`.
- Middleware auth memang secure-by-default untuk non-whitelist; CSRF disable di `/api/storage/**` termitigasi karena auth via Authorization header.
- Atomic pattern benar sudah dipakai di beberapa tempat (aspiration vote `$ne` push, partial unique indexes Participant/Committee, TTL OTP/Session).

---

## Akar Masalah Sistemik (fix ini → puluhan temuan ikut teratasi)

1. **Whitelist prefix GET** di `server/middleware/auth.ts` mempublikasikan subtree utuh (`/api/agenda`, `/api/payment`) dan membebankan self-guarding ke tiap handler — penyebab §2.3, §2-M10, §3.4, dan keluarga IDOR lain. → Ganti ke whitelist path exact per-handler publik.
2. **Tidak ada helper otorisasi per-resource** yang dipakai konsisten (ownership/committee/organizer) di rute pembayaran & dokumen — penyebab §2.1, §2.4, §2.5, §2.8, §3.3, §4.1, §6-T1.
3. **Types TypeScript drift dari schema Mongoose** (`quota`, `amount`, `signerNIM`, flat address) — strict mode membisuangkan bug secara senyap. → Add schema-type test / generate types from schemas.
4. **Cache keyed-by-path untuk response personal/role-gated** — penyebab §2-M8, §6-T2. → Key by user atau jangan cache respons yang bervariasi per-auth.
5. **Rate limit in-memory per-instance** di platform serverless — penyebab §8-T1 dan melemahkan semua mitigasi brute-force. → Pindah ke Upstash (dependency sudah ada).
6. **Error-handling inkonsisten** (`return {statusCode}` vs `throw createError` vs plain-object throw) → 200-with-error bodies dan leak `error.message`. → Satukan helper response/error.
7. **Konvensi repo (Zod, destructure fields, atomic ops) tidak ditegakkan tooling** — pelanggarannya tersebar di news/member/message/carousel/config/project/payment. → Pre-commit grep gate + review checklist.
8. **Regresi tests tidak masuk CI** — bug seperti §2.2 dan §6-T4 sebenarnya sudah "terdeteksi" test tapi tak pernah dieksekusi.

---

## Roadmap Remediasi Disarankan

**Sprint 1 — Darurat (hari 1–3):**
Tambah `ensureCommitteeOrOrganizer` di `payment/verify.post.ts` · rewrite `member/email/index.put.ts` berbasis `event.context.user` + OTP · perbaiki webhook cancel/expire guard status · hapus `/api/agenda` dari GET-prefix whitelist (exact-match) · blokir `proxy.get.ts` · sanitasi `link` OTP · fix boolean batch-committee + tambah `agendaId` filter.

**Sprint 2 — Integritas data & uang (minggu 1):**
Tambah `amount`/`billa_code` ke paymentSchema + migrasi · implement quota atomik (counter reservation) · state machine manual-transfer (`verifying→success/failed`) · order_idunik per attempt · jangan pernah delete row yang pernah success · revoke sessions on credential change.

**Sprint 3 — Fondasi (minggu 2):**
Wire `tests/server` ke CI + perbaiki test drift · helper response/error terpusat + Zod di semua endpoint tulis · rate limiter Upstash · rotasi refresh token + jti di access token · consume-once OTP · httpOnly cookies.

**Sprint 4 — Kualitas (berkelanjutan):**
De-poison caches · fix frontend guards/Stepper/store-reset/XSS nametag · isi `en.json` + repair corrupt file · kurangi hardcoded strings bertahap per modul · rapikan debris repo & README.

---

## Eksekusi Sprint 1 — SELESAI ✅

### Fix keamanan diterapkan

| # | Temuan | File | Perbaikan |
|---|---|---|---|
| 1 | §2.1 bypass pembayaran | `server/api/agenda/[id]/payment/verify.post.ts` | `ensureCommitteeOrOrganizer(agendaId, user)` sebelum mutasi apa pun |
| 2 | §1.1 IDOR change-email → ATO | `server/api/member/email/index.put.ts` | Ditulis ulang: identitas dari sesi (`event.context.user`), mekanisme `token` orphan dihapus, validasi format + unik email antar member. (Tidak ada pemanggil frontend aktif — helper `AfterToken` dead code, halaman `/verify` tidak eksis.) |
| 3 | §3.1 downgrade peserta terbayar | `server/api/payment/notification.post.ts` | Guard atomik `"payment.status": { $ne: "success" }` di semua jalur cancel/deny/expire; guest terbayar tak pernah dihapus; early-return eksplisit untuk status `success` |
| 4 | §2.3 dump PII publik | `server/middleware/auth.ts` | Prefix `/api/agenda` diganti regex exact/leaf: hanya list, `tags`, detail `<24hex>`, `<id>/committee`, `<id>/participant/me`, `<id>/participant/question/answer/<regId>` yang publik (dua terakhir capability-scope demi wizard guest) |
| 5 | §5.1 SSRF proxy | `server/api/storage/proxy.get.ts` | Allowlist host dari `r2_public_domain`/`public_uri`/storage dir; https-only di produksi |
| 6 | §1.2 exfiltrasi OTP via `link` | `server/api/otp/generate.post.ts` | Zod refine: wajib path relatif (`/…`), tolak `//`, `://`, backslash, kontrol-char |
| 7 | §2.4/§2.5 batch lintas user/agenda | `committee/register/batch/index.post.ts`, `participant/register/batch/index.post.ts` | Boolean `!user && !organizer` → `ensureCommitteeOrOrganizer`; filter `agendaId` ditambahkan pada find participant |

### Bug infrastruktur kritis yang ditemukan & diperbaiki saat verifikasi

**Seluruh suite test diam-diam no-op dengan exit code 0** — hook `close` di `nuxt.config.ts:6` memanggil `process.exit()` pada instance Nuxt milik `@nuxt/test-utils` saat config vitest dimuat → vitest mati sebelum menjalankan/mencetak apa pun, termasuk di CI (`bun run test:e2e` "hijau" tanpa eksekusi). Dua perbaikan pendamping di `vitest.config.ts`: alias Nuxt (`~~`,`~`) untuk project `node` (object-form alias hanya exact-match → pakai array+regex), dan `fileParallelism: false` (seed bersama tidak concurrency-safe → E11000 race).

### Test diperbarui/ditambah

- `tests/e2e/setup.ts` — seed Member kini menyertakan `enteredYear` (schema drift membuat seed lama gagal).
- `tests/server/agenda/payment-verify.test.ts` — ditulis ulang utk implementasi atomic + otorisasi: idempotensi already-success, assertion `ensureCommitteeOrOrganizer` dipanggil, bentuk filter transisi atomik.
- `tests/server/payment/notification.test.ts` — assertion disesuaikan dgn guard `$ne: success` **+ test regresi baru**: notifikasi failure telat tidak boleh men-downgrade/menghapus pendaftaran yang sudah bayar.

### Hasil verifikasi

- Target test: **7/7 hijau** (`payment-verify` + `notification`).
- Matriks whitelist middleware: **16/16 perilaku tepat** (publik vs protected).
- Sisa merah = pra-eksisting, bukan regresi sprint ini: `payment-webhook` & `upload-validation` butuh boot server Nuxt penuh (timeout 120 dtk lokal), `midtrans.test` butuh stub `useRuntimeConfig` global, `member-profile.test` kontradiksi schema (audit §6-T4), `encryption.test` menyingkap bug kecil baru: `verifyDocSignature` **melempar** "Encryption block is invalid" alih-alih return `false` untuk key salah (perlu fix sprint berikutnya).

### Residual (disengaja, masuk sprint berikutnya)

- GET prefix `/api/payment` masih publik (dipakai polling status guest) — sprint 2.
- `participant/me` & `question/answer/<regId>` tetap capability-public demi alur registrasi tamu — sprint 2 (bind ke signed token).
