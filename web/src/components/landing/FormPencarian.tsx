import React from 'react';
import { OPSI_RT, OPSI_RW } from '../../constants/landing';
import type { CekPemilihController, ModePencarian } from '../../hooks/useCekPemilih';
import { LandingIcons } from './LandingIcons';

const LABEL_MODE: Record<ModePencarian, string> = {
  nik: 'Cari dengan NIK',
  nama: 'Cari dengan Nama & RT/RW',
};

interface FieldProps {
  id: string;
  label: string;
  children: React.ReactNode;
}

/** Satu baris label + kendali; dipakai keempat isian form. */
const Field: React.FC<FieldProps> = ({ id, label, children }) => (
  <div className="form-group">
    <label htmlFor={id} className="landing-label">{label}</label>
    {children}
  </div>
);

interface PilihanWilayahProps {
  id: string;
  label: string;
  opsi: string[];
  nilai: string;
  onChange: (nilai: string) => void;
}

const PilihanWilayah: React.FC<PilihanWilayahProps> = ({ id, label, opsi, nilai, onChange }) => (
  <Field id={id} label={label}>
    <select
      id={id}
      className="landing-input"
      value={nilai}
      onChange={(e) => onChange(e.target.value)}
      required
    >
      <option value="">Pilih {label}</option>
      {opsi.map(nomor => (
        <option key={nomor} value={nomor}>{label} {nomor}</option>
      ))}
    </select>
  </Field>
);

interface FormPencarianProps {
  pencarian: CekPemilihController;
}

/** Pemilih mode pencarian beserta isian yang menyertainya. */
export const FormPencarian: React.FC<FormPencarianProps> = ({ pencarian }) => {
  const { mode, gantiMode, form, ubahField, loading, errorMsg, cari } = pencarian;

  return (
    <>
      <div className="landing-tabs">
        {(Object.keys(LABEL_MODE) as ModePencarian[]).map(kandidat => (
          <button
            key={kandidat}
            type="button"
            onClick={() => gantiMode(kandidat)}
            className={`landing-tab-btn${mode === kandidat ? ' is-active' : ''}`}
          >
            {LABEL_MODE[kandidat]}
          </button>
        ))}
      </div>

      <form
        className="landing-form"
        onSubmit={(e) => { e.preventDefault(); void cari(); }}
      >
        {errorMsg && <div className="landing-error">{errorMsg}</div>}

        {mode === 'nik' ? (
          <Field id="cek-nik" label="Nomor Induk Kependudukan (NIK)">
            <input
              id="cek-nik"
              className="landing-input"
              type="text"
              inputMode="numeric"
              maxLength={16}
              value={form.nik}
              onChange={(e) => ubahField('nik', e.target.value)}
              placeholder="Masukkan NIK 16 digit..."
              required
            />
          </Field>
        ) : (
          <>
            <Field id="cek-nama" label="Nama Lengkap">
              <input
                id="cek-nama"
                className="landing-input"
                type="text"
                value={form.nama}
                onChange={(e) => ubahField('nama', e.target.value)}
                placeholder="Masukkan nama lengkap sesuai KTP..."
                required
              />
            </Field>

            <div className="landing-rt-rw">
              <PilihanWilayah
                id="cek-rt"
                label="RT"
                opsi={OPSI_RT}
                nilai={form.rt}
                onChange={(nilai) => ubahField('rt', nilai)}
              />
              <PilihanWilayah
                id="cek-rw"
                label="RW"
                opsi={OPSI_RW}
                nilai={form.rw}
                onChange={(nilai) => ubahField('rw', nilai)}
              />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary landing-submit">
          {loading ? (
            <span>Memeriksa data...</span>
          ) : (
            <>
              <LandingIcons.Cari />
              <span>Periksa Data</span>
            </>
          )}
        </button>
      </form>
    </>
  );
};
