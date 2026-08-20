/**
 * Tetapan tingkat aplikasi.
 *
 * Nilai-nilai ini dipakai oleh beberapa hook sekaligus, jadi tempatnya di sini
 * dan bukan di dalam salah satu pemakainya.
 */

/**
 * Live updates reach the origin directly on a forwarded port: the proxy chain in
 * front of it drops the headers a WebSocket handshake needs, so the usual
 * same-origin path cannot carry one. Set per environment via
 * VITE_LIVE_SOCKET_URL — leaving it empty disables the socket and leaves the
 * dashboard on polling, which is what a deployment without its own socket
 * server needs. It must never be pointed at another environment's server, or
 * that environment's activity would drive this one's dashboard.
 */
export const LIVE_SOCKET_URL = import.meta.env.VITE_LIVE_SOCKET_URL ?? '';

/**
 * Used only while the socket is down, so the dashboard keeps moving instead of
 * going stale unnoticed.
 */
export const LIVE_POLL_INTERVAL_MS = 10000;

export const LIVE_SOCKET_RETRY_MS = 15000;

/** Peristiwa socket yang membuat ringkasan dashboard perlu ditarik ulang. */
export const LIVE_EVENTS = ['checkin', 'quick-count', 'update', 'paslon_updated'];

/** Peran yang boleh masuk ke panel web sama sekali. */
export const PERAN_PANEL = ['sekretariat', 'pantarlih'];

/** Rute yang datanya berasal dari ringkasan dashboard. */
const RUTE_DASHBOARD = ['/', '/dashboard', '/quick-count'];

export const adalahRuteDashboard = (path: string) => RUTE_DASHBOARD.includes(path);
