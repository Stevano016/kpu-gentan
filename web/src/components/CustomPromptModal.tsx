import React from 'react';

interface CustomPromptModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  btnText?: string;
  saran?: string[];
  /** Bila diisi, jawaban dibatasi pada daftar ini (bukan teks bebas). */
  pilihan?: any[];
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

/**
 * Asks for a short piece of text — the reason behind a TMS or DPK decision.
 *
 * The browser's own prompt() would do the job, but this panel deliberately
 * replaced every native dialog with its own, and a native prompt also freezes
 * the whole tab while it is open.
 */
export const CustomPromptModal: React.FC<CustomPromptModalProps> = ({
  isOpen,
  title,
  message,
  placeholder,
  btnText = 'Simpan',
  saran = [],
  pilihan,
  onCancel,
  onSubmit,
}) => {
  const [value, setValue] = React.useState('');

  // Each opening starts clean; a leftover reason from the previous voter would
  // be far too easy to submit by accident.
  React.useEffect(() => {
    if (isOpen) setValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const kirim = () => {
    const bersih = value.trim();
    if (bersih) onSubmit(bersih);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
        <h3 className="modal-title" style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: '700' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
          {message}
        </p>

        {pilihan ? (
          // Nilainya tersimpan sebagai kategori tetap di basis data, jadi
          // mengetik bebas hanya akan ditolak server.
          <select
            className="form-control"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ width: '100%', marginBottom: '24px' }}
          >
            <option value="">Pilih alasan...</option>
            {pilihan.map((o) => {
              const val = typeof o === 'string' ? o : o.value;
              const isDisabled = typeof o === 'string' ? false : !!o.disabled;
              return (
                <option key={val} value={val} disabled={isDisabled}>
                  {val}{isDisabled ? ' (Tidak sesuai data)' : ''}
                </option>
              );
            })}
          </select>
        ) : (
          <input
            type="text"
            className="form-control"
            autoFocus
            value={value}
            placeholder={placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') kirim();
              if (e.key === 'Escape') onCancel();
            }}
            style={{ width: '100%', marginBottom: saran.length ? '12px' : '24px' }}
          />
        )}

        {!pilihan && saran.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
            {saran.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setValue(s)}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

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
            onClick={kirim}
            disabled={!value.trim()}
            className="btn btn-primary"
            style={{ minWidth: '80px', padding: '8px 16px', fontSize: '0.875rem' }}
          >
            {btnText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomPromptModal;
