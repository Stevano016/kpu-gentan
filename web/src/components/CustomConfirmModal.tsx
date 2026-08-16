import React from 'react';

interface CustomConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  btnText?: string;
  isDanger?: boolean;
}

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
  btnText = 'Ya',
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '400px', padding: '24px' }}>
        <h3 className="modal-title" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '700' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
          {message}
        </p>
        <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 0 }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            style={{ minWidth: '80px', padding: '8px 16px', fontSize: '0.875rem' }}
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={isDanger ? "btn btn-danger" : "btn btn-primary"}
            style={{ minWidth: '80px', padding: '8px 16px', fontSize: '0.875rem' }}
          >
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
};
export default CustomConfirmModal;
