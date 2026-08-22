import { useEffect } from 'react';
import {
  LIVE_EVENTS,
  LIVE_POLL_INTERVAL_MS,
  LIVE_SOCKET_RETRY_MS,
  LIVE_SOCKET_URL,
  adalahRuteDashboard,
} from '../constants/app';

interface Argumen {
  token: string | null;
  path: string;
  isPantarlih: boolean;
  /** Penyegaran senyap; dipanggil tiap kali ada kabar perubahan. */
  refresh: () => void;
}

/** Alamat socket: lokal selalu ke port terusan di mesin yang sama. */
const alamatSocket = () => {
  const host = window.location.hostname || 'localhost';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  if (isLocalHost) {
    return `ws://${host}:8080`;
  }
  if (LIVE_SOCKET_URL) {
    return LIVE_SOCKET_URL;
  }
  // Dinamis: Ikuti protokol (ws/wss) dan domain/port aktif yang diakses browser
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

/**
 * Live updates for the dashboard.
 *
 * The socket server is reached directly on a forwarded port, because the proxy
 * chain in front of the origin drops the Connection/Upgrade headers a handshake
 * needs. If the socket cannot be established we fall back to polling, so the
 * numbers never silently stop moving during counting.
 *
 * Only the dashboard updates on its own. Reloading a list while someone is
 * working through it loses their place, so the other screens stay put.
 */
export function useLiveDashboard({ token, path, isPantarlih, refresh }: Argumen) {
  useEffect(() => {
    if (!token || isPantarlih || !adalahRuteDashboard(path)) return;

    const socketUrl = alamatSocket();

    let socket: WebSocket | null = null;
    let pollId: number | undefined;
    let retryId: number | undefined;
    let disposed = false;

    // Skip while the tab is in the background — nobody is reading it.
    const segarkanBilaTerlihat = () => { if (!document.hidden) refresh(); };

    const startPolling = () => {
      if (pollId !== undefined) return;
      pollId = window.setInterval(segarkanBilaTerlihat, LIVE_POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (pollId === undefined) return;
      window.clearInterval(pollId);
      pollId = undefined;
    };

    const connect = () => {
      if (disposed) return;
      // No socket configured for this deployment — polling is the whole story.
      if (!socketUrl) {
        startPolling();
        return;
      }
      socket = new WebSocket(socketUrl);

      socket.onopen = () => {
        // Push is live, so the fallback is no longer needed.
        stopPolling();
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (LIVE_EVENTS.includes(payload.event)) segarkanBilaTerlihat();
        } catch {
          // A malformed frame is not worth interrupting the operator over.
        }
      };

      socket.onclose = () => {
        socket = null;
        if (disposed) return;
        startPolling();
        retryId = window.setTimeout(connect, LIVE_SOCKET_RETRY_MS);
      };
    };

    connect();

    // Catch up immediately when the operator comes back to the tab.
    document.addEventListener('visibilitychange', segarkanBilaTerlihat);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', segarkanBilaTerlihat);
      stopPolling();
      if (retryId !== undefined) window.clearTimeout(retryId);
      if (socket) socket.close();
    };
  }, [token, path, isPantarlih, refresh]);
}
