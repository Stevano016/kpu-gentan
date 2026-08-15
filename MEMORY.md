# Project Memory — KPPS Gentan System

This file captures the active state, environment variables, completed tasks, and running processes to keep a clean history.

---

## 📍 Last Known State

- **Laravel Backend API (`/backend`)**: Running at `http://192.168.11.9:8000`. Resolved N+1 query loops in `DashboardController` by replacing map queries with a consolidated `withCount` database request. Updated `TpsController` and `UserController` index endpoints to support page-based pagination.
- **Web Dashboard (`/web`)**: Running at `http://localhost:5173`. Fully paginated all list tables (DPT, DPK, TPS, and KPPS Accounts). Made all page header sections (`.section-header`) sticky at the top on desktop layouts with solid background masking to prevent scroll overlap. Integrated a custom confirm modal overlay that replaces default browser `confirm()` popups. Added show/hide password visibility toggle in login screen.
- **Mobile Client (`/mobile`)**: Analyzer is 100% clean (`No issues found!`). The check-in validation search query and scanning flow now uses the generated `id_pemilih` (with prefix `USH-GTN-026`) instead of NIK. Designed a custom confirm dialog helper (`_showCustomConfirmDialog`) and implemented it for logging out and locking quick count results. Added password visibility toggle in login screen.

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

- None. All requested components, features, and optimizations are 100% complete and verified.
