import { Icons } from '../Icons';

interface MobileTopbarProps {
  isNavOpen: boolean;
  onOpenNav: () => void;
}

/** Shown only on narrow screens, where the sidebar is hidden off-canvas. */
export const MobileTopbar: React.FC<MobileTopbarProps> = ({ isNavOpen, onOpenNav }) => (
  <header className="mobile-topbar">
    <button
      type="button"
      className="mobile-nav-toggle"
      onClick={onOpenNav}
      aria-label="Buka menu"
      aria-expanded={isNavOpen}
    >
      <Icons.Menu />
    </button>
    <div className="mobile-brand">
      <img src="/logo.png" alt="" />
      <span>GENTARA</span>
    </div>
  </header>
);
