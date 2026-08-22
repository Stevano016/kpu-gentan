import React from 'react';
import { DAFTAR_PANTARLIH, SYARAT_PEMILIH, tautanWaPantarlih } from '../../constants/landing';
import { Icons } from '../Icons';
import { LandingIcons } from './LandingIcons';

/** Penanda butir a, b, c, ... mengikuti penomoran pada peraturannya. */
const penanda = (index: number): string => `${String.fromCharCode(97 + index)}.`;

interface SyaratPemilihModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Penjelasan syarat pemilih beserta kontak pantarlih per RW.
 *
 * Muncul dari panel "Data Tidak Ditemukan": warga yang belum terdaftar perlu
 * tahu apakah dirinya memenuhi syarat dan kepada siapa harus mengadu.
 */
export const SyaratPemilihModal: React.FC<SyaratPemilihModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content syarat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Syarat Pemilih &amp; Daftar Pantarlih</h3>
          <button onClick={onClose} className="modal-close" title="Tutup">
            <Icons.Close />
          </button>
        </div>

        <div className="syarat-body">
          <div>
            <h4 className="syarat-heading">Persyaratan Pemilih (Belum Terdaftar di DP4):</h4>
            <ul className="syarat-list">
              {SYARAT_PEMILIH.map((syarat, index) => (
                <li key={syarat}>
                  <span className="syarat-marker">{penanda(index)}</span>
                  <span>{syarat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="syarat-warning">
            <strong>Penting:</strong> Maksimal Pindah datang ditanggal 8 Maret 2026.
            Pindah Datang setelah 8 Maret 2026 Tidak memiliki Hak Pilih.
          </div>

          <div>
            <h4 className="syarat-heading">Silakan Menghubungi Pantarlih:</h4>
            <div className="pantarlih-table-wrap">
              <table className="pantarlih-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>RW</th>
                    <th>WA</th>
                  </tr>
                </thead>
                <tbody>
                  {DAFTAR_PANTARLIH.map(pantarlih => (
                    <tr key={pantarlih.wilayah}>
                      <td>{pantarlih.nama}</td>
                      <td className="pantarlih-wilayah">{pantarlih.wilayah}</td>
                      <td className="pantarlih-aksi">
                        <a
                          href={tautanWaPantarlih(pantarlih)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="wa-btn"
                          title={`Hubungi ${pantarlih.nama} via WhatsApp`}
                        >
                          <LandingIcons.WhatsApp />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
