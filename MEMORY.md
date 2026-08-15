# Project Memory — KPPS Gentan System

This file captures the active state, environment variables, completed tasks, and running processes to keep a clean history.

---

## 📍 Last Known State

- **Laravel Backend API (`/backend`)**: Running at `http://192.168.11.9:8000`. Updated `TpsController::index` to use constrained relation counts `dpt as hadir_count` to fetch real-time check-in counts per TPS without N+1 queries.
- **Web Dashboard (`/web`)**: Running at `http://localhost:5173` (network: `http://192.168.11.9:5173`). Updated TPS list and monitoring table to display "Kehadiran (Hadir)" and "% Kehadiran" metrics.
- **Mobile Client (`/mobile`)**: Analyzer is 100% clean (`No issues found!`). Refactored `HomeScreen` tab layout to support dynamic tabs based on access level. Added a brand new "Dashboard KPPS" tab as Tab 0 for users with full access (`_kppsRole == 'full'`), featuring registered DPT, checked-in DPT, and a circular partisipation progress bar.

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
