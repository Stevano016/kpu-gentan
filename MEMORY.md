# Project Memory — KPPS Gentan System

This file captures the active state, environment variables, completed tasks, and running processes to keep a clean history.

---

## 📍 Last Known State

- **Laravel Backend API (`/backend`)**: Running at `http://localhost:8000`. Added server-side validation to support four voter types (`dpt`, `dpk`, `dps`, `dptb`) in `DptController`. Adjusted `DashboardController` (`getSummary` and `getTpsDetails`) to compute stats for all four categories. Seeded all 6,856 voters from Excel as `dps` by default.
- **Web Dashboard (`/web`)**: Running at `http://localhost:5173`. Added DPS and DPTb options in `DptModal.tsx` dropdown, added filter buttons in `PemilihTab.tsx`, and extended cards/tables in `DashboardTab.tsx` and `TpsDetailTab.tsx` to display statistics for all four voter types.
- **Mobile Client (`/mobile`)**: Analyzer is 100% clean (`No issues found!`). Extended `home_screen.dart` and `dashboard_tab.dart` to compute, validate, and display stats (Total and Check-in) for DPT, DPK, DPS, and DPTb.

---

## 📋 Task History & Context

- **15 Aug 2026**: Initialised Laravel 11 backend project, configured `php.ini` to enable SQLite support, created migrations, models, seeds, controllers, and tested migrations & seeders successfully.
- **15 Aug 2026**: Initialised React Vite (TS) project, configured modern OKLCH CSS theme, built out complete `App.tsx` containing authorization states, dashboard monitors (aggregate widgets, progress rings, quick count bars), TPS status tables, voter CRUD tables, bulk CSV voter upload handlers, and KPPS account provisioners.
- **15 Aug 2026**: Initialised Flutter mobile application, installed dependency extensions (`http`, `shared_preferences`, `path_provider`), implemented local offline cache storage, API syncing handlers, and screens (`LoginScreen`, `HomeScreen`).
- **15 Aug 2026**: Found host local IP (`192.168.11.9`), bound Laravel server to `0.0.0.0` (all interfaces) to allow external calls from physical devices, and updated Flutter API base URL configuration.
- **15 Aug 2026**: Added `mobile_scanner` to dependencies. Replaced TabBar with a clean `BottomNavigationBar` in Flutter. Created `ScannerScreen` for direct physical camera scanning and added input field fallback for PC/emulator testing. Passed `flutter analyze` with 0 issues.
- **15 Aug 2026**: Corrected case-sensitive namespace `chillerlan\QRCode\QRCode` in backend controller to resolve 500 error on QR Code endpoint.
- **15 Aug 2026**: Integrated QR download & printing buttons on web client. Redesigned Edit voter modal to include side-by-side QR preview. Configured voter creation success screen with immediate QR display.
- **15 Aug 2026**: Fixed Flutter sync bug by updating `isOnline` to check reachability of local PC IP (`192.168.11.9:8000`), allowing offline sync in local Wi-Fi sandboxes. Added auto-refresh of DPT cache if scanned NIK is not found locally.
- **15 Aug 2026**: Refactored `HomeScreen` state and views on Flutter to add a dynamic Dashboard tab for full access role. Implemented local calculation of Total DPT, Hadir DPT, and percentage. Added check-in metrics and attendance rate percentage in the web TPS table and optimized the backend query.
- **15 Aug 2026**: Renamed Android app to "Gentara", replaced all Android mipmap launcher icons with high-quality resampled `1786782031433.png`, and added a real-time Quick Count Results card with progress bars to the KPPS dashboard.
- **15 Aug 2026**: Fixed RenderFlex layout overflow in Quick Count input field headers and dashboard cards. Introduced stateful `_syncAction` to display button loaders during the "Simpan Draft" and "Submit Final" processes.
- **15 Aug 2026**: Added Daftar Pemilih Khusus (DPK) support. Extended backend controllers and dashboard APIs, created a DPK sidebar page and stats cards/donut breakdown widgets on the web client, and separated DPT/DPK metrics on the Android dashboard.
- **15 Aug 2026**: Switched check-in validation from NIK to unique voter ID (`USH-GTN-026xxxx`). Migrated backend SQLite database to add `id_pemilih` column and populated existing records. Updated manual and QR code scanner check-in in the Gentara app to search and validate by unique ID. Displayed the unique ID on both DPT and DPK web and mobile lists.
- **15 Aug 2026**: Updated database seeder to inject realistic dummy records containing DPK voters across all TPS. Wiped and re-seeded SQLite backend instance.
- **15 Aug 2026**: Paginated all lists (DPT, DPK, TPS, and KPPS Accounts) on the web dashboard and optimized backend database queries to prevent N+1 query patterns using eager-loading and subquery counters.
- **15 Aug 2026**: Implemented custom password eye toggle on web and mobile. Redesigned mobile alert popups to use a custom rounded Dialog UI. Standardized confirm popups on the web with a custom confirm modal overlay. Made the web panel fully responsive.
- **15 Aug 2026**: Fixed all `.section-header` headers on the web client to remain sticky/fixed at the top of the viewport when scrolling, with a background mask.
- **16 Aug 2026**: Registered `logo.png` image asset in Flutter mobile app, replaced placeholder icons on the login page and home page cards with larger, high-resolution logo assets, and added the logo to the AppBar. Replaced the web dashboard favicon and header icon references with `logo.png` for complete branding integration.
- **16 Aug 2026**: Fully refactored and modularized the web client, mobile client, and backend API as requested, without changing existing logic:
  - **Web Client**: Extracted the large monolithic `App.tsx` file (~1100 lines) into separate modular files: `Icons.tsx` (SVG assets), `CustomConfirmModal.tsx`, `api.ts` (REST client API services), `helpers.ts` (utility helpers), separate components for each view tab (`DashboardTab`, `TpsTab`, `TpsDetailTab`, `DptTab`, `DpkTab`, `KppsTab`), sidebar and loginscreen components, and all modal form components (`TpsModal`, `DptModal`, `ImportCsvModal`, `KppsModal`, `ResetPasswordModal`, `QrViewerModal`, `VoterSuccessModal`). Integrated `react-router-dom` for declarative routing (URLs like `/tps/:id`, login routes, and protected path navigations), removing custom page state routing, and compiled successfully without warnings/errors. Configured WebSocket client connection (ws://<host>:8080) to automatically refresh active dashboard views on update events. Fixed QR code download bug where files saved with a static .png extension instead of matching the underlying base64 SVG MIME type, preventing corrupted image file warnings in Windows Photos. Implemented candidate pairs (Paslon) management dashboard screen (/paslon), add/edit modal form, sidebar menu links, and integrated dynamic candidate name labels on both the general and detail dashboard panels.
  - **Laravel Backend**: Implemented route-level role-based access control using a custom `EnsureRole` middleware (registered in `bootstrap/app.php` and applied in `routes/api.php`). Cleaned up controllers (`DptController`, `TpsController`, `UserController`, `DashboardController`) by removing manual checks. Optimized CSV importer to auto-generate proper unique `id_pemilih` (with format `USH-GTN-026xxxx`) to ensure offline compatibility for Android. Checked PHP syntax with zero errors. Reinforced API security with custom rate limiters (throttle:login limits brute force on login; throttle:api limits general API requests) and parameter sanitization on synchronization endpoints in `SyncController.php`. Created a custom Artisan WebSocket command (`php artisan websocket:serve`) running on port 8080 with automated client handshake and TCP IPC message broadcasting, triggering updates on voter sync and quick count submits. Configured php-qrcode rendering options to output PNG format directly using QRGdImagePNG class wrapper. Added `paslons` database migration, Eloquent model, and `PaslonController` with full CRUD support, real-time WebSocket sync triggers, and seeded default candidate pair data.
  - **Mobile Client**: Extracted monolithic `home_screen.dart` (~1200 lines) by creating a `lib/screens/tabs/` folder containing dedicated widget files: `dashboard_tab.dart`, `validasi_tab.dart`, `quick_count_tab.dart`, and `status_sync_tab.dart`. Decoupled presentation and data states using callbacks. Verified using `flutter analyze` with zero warnings/errors. Added native WebSocket connection to ws://<host>:8080 with auto-reconnection and local database cache updates on sync events. Fixed QR scanning lookup bug to support both USH-GTN-026xxxx ID Pemilih and 16-digit NIK formats to maintain backward compatibility, and updated simulator view textfield guidelines.

- **16 Aug 2026**: Extended Data Pemilih schema with new demographic attributes (`umur`, `status_kawin`, `jenis_kelamin`, `alamat`, `rt`, `rw`, `pekerjaan`, `disabilitas`, `keterangan`). Implemented migrations, model update, controller CRUD validations, and realistic seeding logic on Laravel backend. Created a responsive form in `DptModal` and a collapsible drawer panel in `PemilihTab` to review details on the Web Client. Integrated demographic details display in the mobile check-in verification panel (`validasi_tab.dart`).
- **16 Aug 2026**: Implemented client-side and server-side validation to prevent quick count submissions from exceeding the total registered voters (DPT + DPK) and actual check-in (attendance) counts at that TPS. Verified that WebSocket real-time triggers are fully operational for quick count updates on the Web Dashboard.
- **16 Aug 2026**: Added new `nkk` attribute (Family Card Number) database migration, Eloquent model fillable array, DptController CRUD validation, web form field (DptModal.tsx), web details panel (PemilihTab.tsx), and mobile verification display (validasi_tab.dart). Built Python parser to extract, clean, drop duplicates, and export 6,856 voter records from `Data_Utama_Bersih (999) (1).xlsx` based on `NIK_Pembanding` and `NKK_Pembanding`, mapping `rt` and `rw` columns from `NO_RT_ALT` and `NO_RW_ALT`. Seeded 5 dynamic TPS based on partition rules in `image copy 2.png`, 10 KPPS user accounts, 2 Secretariat users, and 3 candidate pairs.
- **16 Aug 2026**: Added DPS (Daftar Pemilih Sementara) and DPTb (Daftar Pemilih Tambahan) categories across backend API validation and dashboard statistics controllers. Configured `DatabaseSeeder.php` to set all imported voters as `'dps'` by default. Added DPS and DPTb select and filter UI controls on React web dashboard (`DptModal.tsx`, `PemilihTab.tsx`, `DashboardTab.tsx`, `TpsDetailTab.tsx`) and verified compilation is clean. Refactored mobile client (`home_screen.dart` and `dashboard_tab.dart`) to count, display, and validate quick count bounds using all four voter types, passing `flutter analyze` successfully with zero warnings/errors. Fixed a bug in `PemilihTab.tsx` where voter type badge was hardcoded to display "DPT" instead of "DPS" or "DPTb". Rearranged filter buttons layout order to place DPS and DPTb next to "Semua Pemilih" first.

---

## 🛠️ Local Environment Notes

- **Operating System**: Windows
- **Node.js**: v24.15.0 (npm v11.6.0)
- **PHP**: v8.4.19 CLI (SQLite extension enabled)
- **Composer**: v2.9.5
- **Flutter**: v3.35.4 (Dart 3.9.2)
- **Database**: SQLite (`backend/database/database.sqlite`)

---

## 🚧 Active/Pending Tasks

- None. All requested components, features, and optimizations are 100% complete, modularized, and verified.
