import React from 'react';

interface LoadingHintProps {
  show: boolean;
  label?: string;
}

/**
 * Loading text for a section that is being refetched.
 *
 * The slot is always rendered and always the same height — only the opacity
 * changes. Mounting and unmounting the text instead (the previous approach)
 * pushed everything below it down and back up on every fetch, which read as the
 * whole page flickering while the sidebar and header sat still.
 */
export const LoadingHint: React.FC<LoadingHintProps> = ({ show, label = 'Memuat data...' }) => (
  <div
    aria-live="polite"
    aria-busy={show}
    style={{
      height: '18px',
      lineHeight: '18px',
      marginBottom: '12px',
      fontSize: '0.875rem',
      color: 'var(--text-muted)',
      opacity: show ? 1 : 0,
      transition: 'opacity 0.2s ease',
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >
    {label}
  </div>
);
