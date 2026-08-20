import { useCallback, useEffect, useState } from 'react';

interface Argumen {
  /** Rute aktif; laci menu ditutup setiap kali berpindah halaman. */
  path: string;
  showError: (message: string, title?: string) => void;
}

export interface LayoutController {
  /** Sidebar ciut menjadi rail ikon. */
  isSidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
  /** Di layar sempit sidebar menjadi laci yang menutupi halaman. */
  isMobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
}

const KUNCI_SIDEBAR = 'sidebarCollapsed';

/** Kondisi kerangka halaman: sidebar, laci menu, dan mode layar penuh. */
export function useLayout({ path, showError }: Argumen): LayoutController {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => localStorage.getItem(KUNCI_SIDEBAR) === '1',
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setIsMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setIsMobileNavOpen(false), []);

  const toggleSidebarCollapsed = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(KUNCI_SIDEBAR, next ? '1' : '0');
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      showError('Browser menolak mode layar penuh. Gunakan tombol F11 sebagai gantinya.', 'Layar Penuh Gagal');
    }
  }, [showError]);

  // The drawer covers the page, so leaving it open across a navigation would
  // hide whatever the operator just asked for.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [path]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileNavOpen(false); };
    document.addEventListener('keydown', onKey);
    // Stop the page behind the drawer from scrolling under it.
    document.body.classList.add('nav-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('nav-open');
    };
  }, [isMobileNavOpen]);

  // Sinkronkan state saat pengguna keluar fullscreen lewat F11 / Escape.
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  return {
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isFullscreen,
    toggleFullscreen,
    isMobileNavOpen,
    openMobileNav,
    closeMobileNav,
  };
}
