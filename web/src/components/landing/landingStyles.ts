/**
 * Gaya halaman publik, disuntikkan sekali oleh `LandingPage`.
 *
 * Halaman ini dulunya menaruh hampir seluruh gayanya di atribut `style`,
 * sehingga label dan kotak input yang sama ditulis ulang empat kali dan efek
 * sorot dikerjakan penangan `onMouseEnter`/`onMouseLeave` di JavaScript. Kelas
 * di bawah menampung keduanya: bentuk yang berulang cukup ditulis sekali, dan
 * sorot kembali menjadi `:hover`.
 *
 * Semua kelas di sini berawalan `landing-`, `voter-`, `syarat-`, `pantarlih-`,
 * atau `wa-`, dan hanya dipakai komponen di dalam folder ini.
 */
export const GAYA_LANDING = `
  /* ---------- Kerangka halaman ---------- */
  .landing-page {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--background);
    color: var(--text);
  }
  .landing-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background-color: var(--surface);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .landing-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .landing-brand-logo {
    height: 36px;
    width: auto;
  }
  .landing-brand-text {
    display: block;
    font-weight: 700;
    font-size: 1.15rem;
    line-height: 1.2;
    color: var(--primary);
  }
  .landing-brand-sub {
    display: block;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .landing-login-btn {
    padding: 8px 16px;
    font-size: 0.875rem;
  }
  .landing-login-btn svg {
    width: 16px;
    height: 16px;
    margin-right: 6px;
  }
  .landing-main {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 24px 92px 24px;
  }
  .landing-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
    max-width: 540px;
  }
  .landing-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--warning);
    text-align: center;
    text-transform: uppercase;
  }

  /* ---------- Kartu pencarian ---------- */
  .landing-card {
    width: 100%;
    max-width: 540px;
    background-color: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    overflow: hidden;
  }
  .landing-card-header {
    padding: 32px 32px 24px 32px;
    text-align: center;
    border-bottom: 1px solid var(--border);
  }
  .landing-card-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 8px;
  }
  .landing-tabs {
    display: flex;
    background-color: var(--surface-alt);
    padding: 6px;
    margin: 24px 32px 0 32px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
  }
  .landing-tab-btn {
    flex: 1;
    width: 50%;
    padding: 10px;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
  }
  .landing-tab-btn.is-active {
    background: var(--surface);
    color: var(--primary);
    box-shadow: var(--shadow);
  }

  /* ---------- Form ---------- */
  .landing-form {
    padding: 24px 32px 32px 32px;
  }
  .landing-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--text);
  }
  .landing-input {
    width: 100%;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    background-color: var(--surface);
    font-size: 0.95rem;
    outline: none;
    transition: var(--transition);
  }
  select.landing-input {
    cursor: pointer;
  }
  .landing-rt-rw {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }
  .landing-error {
    padding: 12px 16px;
    background-color: var(--danger-light);
    color: var(--danger);
    border: 1px solid oklch(0.85 0.05 28);
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 20px;
  }
  .landing-submit {
    width: 100%;
    padding: 14px;
    font-size: 1rem;
    font-weight: 600;
    justify-content: center;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow);
  }
  .landing-submit svg {
    width: 20px;
    height: 20px;
    margin-right: 8px;
  }

  /* ---------- Hasil pencarian ---------- */
  .landing-results {
    padding: 0 32px 32px 32px;
    border-top: 1px solid var(--border);
    background-color: var(--surface-alt);
  }
  .landing-results-title {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text);
    margin: 24px 0 16px 0;
  }
  .landing-results-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .voter-card {
    padding: 20px;
    background-color: var(--surface);
    border-radius: var(--radius-md);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }
  .voter-card-name {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--primary);
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--border);
  }
  .voter-detail-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
    font-size: 0.875rem;
    color: var(--text);
  }
  .voter-detail-row {
    display: flex;
    border-bottom: 1px solid var(--background);
    padding-bottom: 6px;
  }
  .voter-detail-row.is-tps {
    align-items: center;
  }
  .voter-detail-label {
    width: 120px;
    flex-shrink: 0;
    color: var(--text-muted);
    font-weight: 500;
  }
  .voter-detail-value {
    word-break: break-word;
  }
  .voter-detail-value.is-mono {
    font-family: Consolas, monospace;
    font-weight: 600;
  }
  .voter-detail-value.is-tps {
    font-weight: 700;
    color: var(--primary);
  }
  .voter-tps {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .voter-tps-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    font-size: 0.725rem;
    font-weight: 600;
    color: var(--primary);
    text-decoration: none;
    background-color: var(--primary-light);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    transition: var(--transition);
  }
  .voter-tps-link:hover {
    background-color: var(--border);
  }
  .voter-tps-link svg {
    width: 12px;
    height: 12px;
  }
  .voter-status {
    margin-top: 16px;
    padding: 10px 14px;
    background-color: var(--success-light);
    color: var(--success);
    border-radius: var(--radius-sm);
    border: 1px solid oklch(0.85 0.05 145);
    font-size: 0.825rem;
    font-weight: 600;
    text-align: center;
  }

  /* ---------- Data tidak ditemukan ---------- */
  .landing-empty {
    padding: 24px;
    background-color: var(--warning-light);
    border: 1px dashed var(--warning);
    border-radius: var(--radius-md);
    color: var(--text);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .landing-empty-title {
    font-weight: 700;
    color: oklch(0.55 0.12 78);
    margin-bottom: 8px;
  }
  .landing-empty-text {
    color: var(--text-muted);
  }
  .landing-empty-text + .landing-empty-text {
    margin-top: 8px;
  }
  .landing-syarat-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding: 8px 16px;
    background-color: var(--primary);
    color: var(--surface);
    border: none;
    border-radius: var(--radius-sm);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: var(--transition);
  }
  .landing-syarat-btn:hover {
    background-color: var(--primary-hover);
  }
  .landing-syarat-btn svg {
    width: 16px;
    height: 16px;
  }

  /* ---------- Modal syarat pemilih ---------- */
  /* Modal ini lebih rapat daripada modal panel: jarak antar bagian diatur oleh
     gap, jadi margin bawaan .modal-header/.modal-footer dikecilkan. */
  .modal-content.syarat-modal {
    max-width: 600px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .syarat-modal .modal-header {
    margin-bottom: 8px;
  }
  .syarat-modal .modal-title {
    color: var(--primary);
  }
  .syarat-modal .modal-close {
    padding: 4px;
  }
  .syarat-modal .modal-footer {
    margin-top: 8px;
  }
  .syarat-modal .modal-footer .btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }
  .syarat-body {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 8px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .syarat-heading {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 10px;
  }
  .syarat-list {
    list-style-type: none;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 0.875rem;
    line-height: 1.4;
  }
  .syarat-list li {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .syarat-marker {
    color: var(--primary);
    font-weight: bold;
  }
  .syarat-warning {
    padding: 12px 16px;
    background-color: var(--danger-light);
    border: 1px solid var(--danger);
    border-radius: var(--radius-sm);
    color: var(--danger);
    font-size: 0.85rem;
    font-weight: 500;
    line-height: 1.4;
  }
  .pantarlih-table-wrap {
    overflow-x: auto;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
  }
  .pantarlih-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    text-align: left;
  }
  .pantarlih-table th {
    padding: 8px;
    font-weight: 600;
    background-color: var(--surface-alt);
  }
  .pantarlih-table th:nth-child(1) { width: 60%; }
  .pantarlih-table th:nth-child(2) { width: 25%; }
  .pantarlih-table th:nth-child(3) { width: 15%; text-align: center; }
  .pantarlih-table td {
    padding: 8px;
    font-weight: 600;
  }
  .pantarlih-table tr {
    border-bottom: 1px solid var(--border);
  }
  .pantarlih-table tbody tr:last-child {
    border-bottom: none;
  }
  .pantarlih-wilayah {
    color: var(--primary);
  }
  .pantarlih-table td.pantarlih-aksi {
    padding: 8px 4px;
    text-align: center;
  }
  /* Hijau WhatsApp; sengaja di luar token tema karena mengikuti warna mereknya. */
  .wa-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: oklch(0.62 0.16 145);
    color: #ffffff;
    border: none;
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
  }
  .wa-btn:hover {
    background-color: oklch(0.55 0.16 145);
    transform: scale(1.1);
  }
  .wa-btn svg {
    width: 18px;
    height: 18px;
  }

  /* ---------- Footer ---------- */
  .landing-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 16px;
    text-align: center;
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.4;
    color: var(--text-muted);
    border-top: 1px solid var(--border);
    background-color: var(--surface);
    z-index: 1000;
  }
  .landing-footer-title {
    margin-bottom: 6px;
  }
  .landing-credit-wrap {
    width: 100%;
    box-sizing: border-box;
    text-align: center;
  }
  .landing-credit {
    display: inline-block;
    max-width: 100%;
    box-sizing: border-box;
    padding: 4px 10px;
    background-color: var(--primary-light);
    color: var(--primary);
    border: 1px solid oklch(0.55 0.16 165 / 0.15);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-align: center;
  }
  .landing-credit-logo {
    display: inline-block;
    height: 22px;
    margin-right: 6px;
    border-radius: 3px;
    vertical-align: middle;
  }
  .landing-credit-text {
    display: inline;
    vertical-align: middle;
  }

  /* ---------- Layar kecil ---------- */
  @media (max-width: 576px) {
    .landing-header {
      padding: 12px 16px;
    }
    .landing-brand-text {
      font-size: 1rem;
    }
    .landing-brand-sub {
      font-size: 0.65rem;
    }
    .landing-login-btn {
      padding: 6px 12px;
      font-size: 0.8rem;
    }
    .landing-login-btn-text {
      display: none;
    }
    .landing-login-btn svg {
      margin-right: 0;
    }
    .landing-main {
      padding: 16px 12px 68px 12px;
    }
    .landing-card-header {
      padding: 20px 20px 16px 20px;
    }
    .landing-tabs {
      margin: 16px 20px 0 20px;
      flex-direction: column;
      gap: 6px;
    }
    .landing-tab-btn {
      width: 100%;
      padding: 8px;
      font-size: 0.85rem;
    }
    .landing-form {
      padding: 16px 20px 20px 20px;
    }
    .landing-results {
      padding: 0 20px 20px 20px;
    }
  }

  @media (max-width: 480px) {
    .voter-detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
      padding-bottom: 8px;
    }
    .voter-detail-label {
      width: auto;
      margin-bottom: 2px;
    }
  }
`;
