const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal ? 'http://localhost:8000/api' : `${window.location.origin}/api`;

export const getAuthHeaders = (token: string | null) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json',
});

/**
 * Dipanggil sekali saat panel menerima 401 dari permintaan yang membawa token.
 *
 * Sesi panel web punya umur — lihat `User::sesiKedaluwarsaPada()` di backend —
 * jadi 401 bukan lagi kejadian aneh yang bisa didiamkan per pemanggil. Kalau
 * tiap pemanggil menanganinya sendiri, akan selalu ada satu yang lupa, dan
 * petugas melihat layar kosong tanpa penjelasan alih-alih diminta masuk lagi.
 */
let saatSesiBerakhir: (() => void) | null = null;

export const daftarkanPenanganSesiBerakhir = (fn: (() => void) | null) => {
  saatSesiBerakhir = fn;
};

const permintaan = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const res = await fetch(input, init);

  if (res.status === 401) {
    saatSesiBerakhir?.();
  }

  return res;
};

export const ApiService = {
  async getProfile(token: string) {
    return permintaan(`${API_URL}/me`, { headers: getAuthHeaders(token) });
  },

  async login(username: string, password: string) {
    // Sengaja memakai fetch mentah: gagal masuk bukan "sesi berakhir", dan
    // memicu penanganan sesi saat orang belum punya sesi jelas keliru.
    return fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  async logout(token: string) {
    return permintaan(`${API_URL}/logout`, { 
      method: 'POST', 
      headers: getAuthHeaders(token) 
    });
  },

  async getDashboardSummary(token: string) {
    return permintaan(`${API_URL}/dashboard/summary`, { headers: getAuthHeaders(token) });
  },

  async getTpsList(token: string) {
    return permintaan(`${API_URL}/tps`, { headers: getAuthHeaders(token) });
  },

  async getTpsPage(token: string, page: number) {
    return permintaan(`${API_URL}/tps?page=${page}`, { headers: getAuthHeaders(token) });
  },

  async getTpsDetail(token: string, id: number) {
    return permintaan(`${API_URL}/dashboard/tps/${id}`, { headers: getAuthHeaders(token) });
  },

  // type kosong = tampilkan DPT dan DPK sekaligus
  async getDpts(token: string, page: number, search = '', tpsId = '', type = '') {
    let url = `${API_URL}/dpt?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tpsId) url += `&tps_id=${tpsId}`;
    if (type) url += `&jenis_pemilih=${type}`;
    return permintaan(url, { headers: getAuthHeaders(token) });
  },

  async getQrCode(token: string, nik: string) {
    return permintaan(`${API_URL}/dpt/${nik}/qrcode`, { headers: getAuthHeaders(token) });
  },

  async createTps(token: string, nama: string, wilayah: string) {
    return permintaan(`${API_URL}/tps`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, wilayah })
    });
  },

  async saveDpt(token: string, payload: any, editingNik?: string) {
    const url = editingNik ? `${API_URL}/dpt/${editingNik}` : `${API_URL}/dpt`;
    const method = editingNik ? 'PUT' : 'POST';
    return permintaan(url, {
      method,
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async deleteDpt(token: string, nik: string) {
    return permintaan(`${API_URL}/dpt/${nik}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  },

  async importCsv(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return permintaan(`${API_URL}/dpt/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
  },

  async getKppsUsers(token: string, page: number, role = '') {
    let url = `${API_URL}/users?page=${page}`;
    if (role) url += `&role=${role}`;
    return permintaan(url, { headers: getAuthHeaders(token) });
  },

  async createKpps(token: string, payload: any) {
    return permintaan(`${API_URL}/users`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async resetKppsPassword(token: string, id: number, passwordVal: string) {
    return permintaan(`${API_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordVal })
    });
  },

  async deleteKpps(token: string, id: number) {
    return permintaan(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  },

  async getPaslons(token: string) {
    return permintaan(`${API_URL}/paslon`, { headers: getAuthHeaders(token) });
  },

  async createPaslon(token: string, form: FormData) {
    // Tanpa Content-Type manual: browser yang menyusun boundary multipart.
    return permintaan(`${API_URL}/paslon`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: form
    });
  },

  async updatePaslon(token: string, id: number, form: FormData) {
    // PHP tidak mem-parsing berkas pada request PUT, jadi dikirim sebagai POST
    // dengan _method=PUT — cara baku Laravel untuk unggahan saat memperbarui.
    form.append('_method', 'PUT');
    return permintaan(`${API_URL}/paslon/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: form
    });
  },

  async deletePaslon(token: string, id: number) {
    return permintaan(`${API_URL}/paslon/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  },

  // --- Perpindahan tahapan pendataan ---

  async ringkasanTahapan(token: string) {
    return permintaan(`${API_URL}/tahapan/ringkasan`, { headers: getAuthHeaders(token) });
  },

  async verifikasiDp4(token: string, payload: { tps_id?: string | number } = {}) {
    return permintaan(`${API_URL}/tahapan/verifikasi`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async tetapkanDpt(token: string, payload: { tps_id?: string | number; paksa?: boolean } = {}) {
    return permintaan(`${API_URL}/tahapan/tetapkan`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async tandaiTms(token: string, nik: string, alasan: string) {
    return permintaan(`${API_URL}/tahapan/${nik}/tms`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ alasan })
    });
  },

  async batalkanTms(token: string, nik: string) {
    return permintaan(`${API_URL}/tahapan/${nik}/tms`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  },

  async tandaiDpk(token: string, nik: string, alasan: string) {
    return permintaan(`${API_URL}/tahapan/${nik}/dpk`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ alasan })
    });
  },

  async batalkanDpk(token: string, nik: string) {
    return permintaan(`${API_URL}/tahapan/${nik}/dpk`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  },

  // --- Ekspor data ---

  async daftarRw(token: string) {
    return permintaan(`${API_URL}/export/rw`, { headers: getAuthHeaders(token) });
  },

  async exportPemilih(token: string, params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return permintaan(`${API_URL}/export/pemilih${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(token)
    });
  },

  // --- Pengelompokan per Kartu Keluarga ---

  async getKeluarga(token: string, params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return permintaan(`${API_URL}/keluarga${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(token)
    });
  },

  async getWilayahKeluarga(token: string, params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return permintaan(`${API_URL}/keluarga/wilayah${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(token)
    });
  },

  async getKeluargaUntukEkspor(token: string, params: Record<string, string> = {}) {
    const qs = new URLSearchParams(params).toString();
    return permintaan(`${API_URL}/keluarga/ekspor${qs ? `?${qs}` : ''}`, {
      headers: getAuthHeaders(token)
    });
  }
};
