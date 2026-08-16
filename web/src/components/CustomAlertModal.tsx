import React, { useEffect, useRef } from 'react';

export type AlertVariant = 'success' | 'error';

interface CustomAlertModalProps {
  isOpen: boolean;
  variant: AlertVariant;
  title: string;
  message: string;
  onClose: () => void;
  btnText?: string;
}

const SuccessIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v5" />
    <path d="M12 16h.01" />
  </svg>
);

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  isOpen,
  variant,
  title,
  message,
  onClose,
  btnText = 'Selesai',
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    btnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = variant === 'success';
  const accent = isSuccess ? 'var(--success)' : 'var(--danger)';
  const accentLight = isSuccess ? 'var(--success-light)' : 'var(--danger-light)';

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div
        className="modal-content"
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        style={{ maxWidth: '380px', padding: '28px 24px', textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            backgroundColor: accentLight,
            color: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isSuccess ? <SuccessIcon /> : <ErrorIcon />}
        </div>

        <h3 className="modal-title" style={{ marginBottom: '8px', fontSize: '1.15rem', fontWeight: 700 }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '24px' }}>
          {message}
        </p>

        <button
          ref={btnRef}
          type="button"
          onClick={onClose}
          className={isSuccess ? 'btn btn-primary' : 'btn btn-danger'}
          style={{ width: '100%', justifyContent: 'center', padding: '10px 16px', fontSize: '0.875rem' }}
        >
          {btnText}
        </button>
      </div>
    </div>
  );
};

export default CustomAlertModal;
