# Product Requirements Document (PRD)
## Aplikasi Android KPPS (Flutter) + Dashboard Web Sekretariat

**Versi:** 0.2 (Draft — revisi dari PRD sistem KPPS sebelumnya)
**Tanggal:** 15 Agustus 2026
**Status:** Draft untuk direview

---

## 1. Latar Belakang

Melanjutkan PRD sebelumnya, sistem ini dipecah menjadi **dua platform** dengan hak akses berbeda (RBAC):

1. **Aplikasi Android (Flutter)** — dipakai oleh **KPPS** di lapangan (TPS) untuk validasi kehadiran pemilih (scan QR/NIK) dan input hasil quick count.
2. **Web** — dipakai oleh **Sekretariat** untuk kelola data master DPT dan memantau dashboard agregat/per TPS.

Pemisahan ini masuk akal secara operasional: KPPS butuh alat yang portabel & cepat dipakai di TPS (HP Android), sementara sekretariat butuh alat manajemen data yang lebih kompleks (input massal DPT, monitoring lintas TPS) yang lebih nyaman lewat web/desktop.

## 2. Tujuan (Goals)

1. Menyediakan aplikasi Android ringan untuk KPPS: validasi pemilih (QR/NIK) + input quick count.
2. Menyediakan dashboard web untuk sekretariat: kelola DPT + monitoring real-time.
3. Menerapkan RBAC yang jelas agar KPPS **tidak bisa** mengubah data master (DPT), hanya bisa input data operasional TPS-nya sendiri.
4. Data dari aplikasi Android (KPPS) tersinkron ke database yang sama dengan dashboard web (sekretariat), sehingga sekretariat bisa pantau real-time/near real-time.

### Non-Goals (di luar scope v1)
- Bukan pengganti sistem rekapitulasi suara resmi KPU.
- Tidak menangani distribusi logistik surat suara.
- v1 tidak mencakup role tambahan di luar KPPS & Sekretariat (misal: pemantau eksternal, saksi partai) — bisa jadi v2.

## 3. Arsitektur Platform & RBAC

| Platform | Pengguna | Fungsi Utama |
|---|---|---|
| **Android (Flutter)** | KPPS (petugas TPS) | Login, scan QR/input NIK untuk validasi kehadiran, input quick count |
| **Web** | Sekretariat | Login, input & kelola seluruh data DPT, lihat dashboard umum & per TPS |

### Role Permission Matrix

| Aksi | KPPS (Android) | Sekretariat (Web) |
|---|---|---|
| Login | ✅ (scope: 1 TPS) | ✅ (scope: semua TPS) |
| Scan QR / input NIK untuk validasi kehadiran | ✅ | ❌ (read-only, hanya lihat hasil) |
| Input quick count | ✅ (hanya TPS-nya) | ❌ (read-only) |
| Input/kelola seluruh data DPT (CRUD) | ❌ | ✅ |
| Lihat dashboard umum (semua TPS) | ❌ | ✅ |
| Lihat dashboard TPS sendiri | ✅ | ✅ |
| Kelola akun KPPS | ❌ | ✅ *(disarankan v1, agar sekretariat bisa provision akun per TPS)* |

**Catatan desain:** KPPS di Android sengaja dibatasi hanya ke 2 aksi (validasi + quick count) — sesuai instruksi, tidak ada akses ke manajemen DPT dari sisi KPPS. Ini juga mengurangi risiko data DPT diubah sembarangan dari lapangan.

## 4. Functional Requirements — Aplikasi Android (KPPS)

### 4.1 Login KPPS
- Login (username/password, akun di-provision oleh sekretariat lewat web).
- Sesi otomatis ter-scope ke 1 TPS spesifik.
- Token disimpan aman di device (secure storage), dengan expiry & refresh token untuk sesi panjang di hari-H.

### 4.2 Scan QR Calon Pemilih (Validasi)
- Gunakan kamera device (`mobile_scanner` atau `qr_code_scanner` di Flutter) untuk scan QR pemilih.
- Hasil scan dicocokkan ke data DPT TPS tersebut (data DPT di-cache lokal di app agar validasi tetap jalan walau sinyal lemah — lihat bagian offline-first).
- Status hasil:
  - **Match & belum hadir** → tandai hadir, catat timestamp, tampilkan konfirmasi (nama & foto jika ada, agar KPPS bisa cross-check visual).
  - **Match tapi sudah hadir** → tampilkan warning jelas (mencegah double check-in).
  - **Tidak ditemukan di DPT TPS ini** → tampilkan error + opsi lihat TPS yang benar (jika data tersedia).

### 4.3 Alternatif Input NIK Manual
- Form input NIK (16 digit, validasi format di client-side sebelum submit).
- Alur validasi identik dengan scan QR setelah NIK match ditemukan.
- Berguna untuk kasus: QR rusak/hilang, kamera bermasalah, atau device pemilih tidak ada.

### 4.4 Input Quick Count
- Form input jumlah suara per kandidat/partai untuk TPS tersebut.
- Ringkasan/review sebelum submit final.
- Setelah submit final → status "locked", perubahan berikutnya butuh alur revisi (tercatat, bukan overwrite diam-diam).
- Quick count tersimpan lokal dulu jika offline, auto-sync saat online kembali.

### 4.5 Mode Offline-First (kritis untuk Android)
- TPS sering minim sinyal → app harus:
  - Download & cache data DPT TPS terkait saat login (selagi masih ada koneksi, misal sebelum berangkat ke TPS).
  - Simpan hasil validasi & quick count ke local storage (misal SQLite/Drift/Hive) dulu.
  - Auto-sync ke server begitu koneksi tersedia, dengan indikator status sync yang jelas ke KPPS (misal badge "3 data belum tersinkron").
  - Tangani konflik sinkronisasi (misal: kalau device lain sudah submit data pemilih yang sama → beri notifikasi, bukan silent overwrite).

## 5. Functional Requirements — Web (Sekretariat)

### 5.1 Login Sekretariat
- Login dengan akses penuh (semua TPS).

### 5.2 Kelola Data DPT
- Input seluruh DPT (bisa manual per-baris, dan idealnya **bulk import** via CSV/Excel karena jumlah data DPT biasanya besar).
- Assign data pemilih ke TPS terkait.
- Generate/kelola QR pemilih (kalau QR di-generate dari sistem ini, bukan dari sumber eksternal — perlu klarifikasi, lihat bagian 8).
- Kelola akun KPPS per TPS (create/reset password).

### 5.3 Dashboard Umum (Agregat Semua TPS)
- Chart persentase kehadiran vs total DPT (nasional/wilayah keseluruhan).
- Chart hasil quick count agregat per kandidat/partai.
- Status pelaporan: jumlah TPS yang sudah submit quick count vs belum, dan jumlah TPS yang datanya belum sync (relevan karena app Android offline-first).

### 5.4 Dashboard per TPS
- Persentase kehadiran per TPS.
- Detail hasil quick count per TPS.
- List pemilih yang sudah check-in beserta waktunya.
- Status koneksi/sync device KPPS TPS tersebut (opsional tapi berguna untuk troubleshooting hari-H).

## 6. Alur Kerja (User Flow)

**Alur KPPS (Android):**
1. Sekretariat provision akun KPPS + assign ke TPS (via web).
2. KPPS login di app → data DPT TPS ter-cache lokal.
3. Hari-H: KPPS scan QR / input NIK per pemilih yang datang.
4. Sistem validasi (lokal dulu jika offline) → sync ke server saat online.
5. Setelah TPS tutup, KPPS input quick count → submit final.
6. Semua data (kehadiran + quick count) tersinkron ke server, muncul di dashboard web sekretariat.

**Alur Sekretariat (Web):**
1. Sebelum hari-H: import/input DPT, assign ke TPS, buat akun KPPS.
2. Hari-H: pantau dashboard umum & per TPS secara real-time/near real-time.
3. Setelah semua TPS selesai: lihat rekap agregat quick count.

## 7. Data Model (Dasar, Diperbarui dengan Role)

| Entity | Field Utama |
|---|---|
| **TPS** | id, nama/nomor TPS, wilayah, total DPT |
| **Pemilih (DPT)** | NIK, nama, TPS_id, status_hadir, waktu_checkin, qr_payload |
| **User** | id, username, role (`kpps` / `sekretariat`), TPS_id (nullable untuk sekretariat) |
| **QuickCount** | TPS_id, kandidat/partai, jumlah_suara, status (draft/final), submitted_at |
| **SyncLog** *(baru — untuk tracking offline-first)* | device_id, TPS_id, jenis_data, status_sync, waktu_sync |
| **AuditLog** | user_id, aksi, waktu, detail perubahan |

## 8. Non-Functional Requirements

- **Offline-first (prioritas tinggi):** ini bukan "nice to have" — mengingat konektivitas TPS sering buruk, app Android harus tetap fungsional tanpa internet untuk validasi & quick count.
- **Keamanan data:** NIK & data pemilih adalah data pribadi sensitif → enkripsi data tersimpan di device (khususnya cache DPT lokal), HTTPS untuk semua komunikasi API, token auth dengan expiry wajar.
- **RBAC ketat di level API**, bukan hanya di UI — endpoint kelola DPT harus reject request dari role KPPS meski request dikirim manual (bukan lewat app).
- **Performa app ringan** — device KPPS di lapangan kemungkinan spesifikasi menengah ke bawah, app harus tetap responsif.
- **Auditability:** semua perubahan status kehadiran & quick count tercatat siapa/kapan.

## 9. Rekomendasi Teknis (Awal)

- **Mobile:** Flutter (sesuai permintaan) — paket yang relevan: `mobile_scanner` (QR), `drift`/`sqflite` (local DB), `flutter_secure_storage` (token), `connectivity_plus` (deteksi status koneksi), state management sesuai preferensi tim (Riverpod/Bloc/Provider).
- **Backend & Web Sekretariat:** bisa pakai stack Laravel (konsisten dengan pengalaman kamu di proyek lain) sebagai API + panel web, atau pisah jadi API (Laravel) + frontend web terpisah kalau mau lebih modular.
- **Sinkronisasi:** REST API dengan pola "queue lokal → push saat online" di sisi Flutter, idealnya idempotent (pakai unique ID per transaksi validasi agar aman kalau retry sync).

## 10. Pertanyaan Terbuka untuk Diklarifikasi

1. QR pemilih di-generate dari sistem ini (oleh sekretariat saat input DPT) atau dari sumber eksternal? Ini menentukan isi payload QR & alur bagian 5.2.
2. Bulk import DPT — format sumber datanya seperti apa (CSV dari Dukcapil/panitia pusat, Excel manual, dll)?
3. Berapa skala TPS yang ditargetkan? Menentukan kebutuhan infrastruktur backend & strategi sync.
4. Apakah quick count butuh bukti foto formulir (C1), atau cukup input angka manual?
5. Apakah akun KPPS 1:1 dengan device tertentu, atau bisa login dari device manapun (relevan untuk desain local cache & sync)?
6. Konteks penggunaan: simulasi/pemilu internal (kampus/organisasi) atau skala resmi? Menentukan tingkat kepatuhan perlindungan data pribadi yang wajib diterapkan.

---

*Dokumen ini melanjutkan/merevisi PRD sistem KPPS sebelumnya dengan pemisahan platform (Android/Flutter untuk KPPS, Web untuk Sekretariat) dan RBAC yang lebih eksplisit.*
