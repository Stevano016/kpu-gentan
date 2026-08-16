const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_URL = isLocal ? 'http://localhost:8000/api' : `${window.location.origin}/api`;

export const getAuthHeaders = (token: string | null) => ({
  'Authorization': `Bearer ${token}`,
  'Accept': 'application/json',
});

export const ApiService = {
  async getProfile(token: string) {
    return fetch(`${API_URL}/me`, { headers: getAuthHeaders(token) });
  },

  async login(username: string, password: string) {
    return fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ username, password })
    });
  },

  async logout(token: string) {
    return fetch(`${API_URL}/logout`, { 
      method: 'POST', 
      headers: getAuthHeaders(token) 
    });
  },

  async getDashboardSummary(token: string) {
    return fetch(`${API_URL}/dashboard/summary`, { headers: getAuthHeaders(token) });
  },

  async getTpsList(token: string) {
    return fetch(`${API_URL}/tps`, { headers: getAuthHeaders(token) });
  },

  async getTpsPage(token: string, page: number) {
    return fetch(`${API_URL}/tps?page=${page}`, { headers: getAuthHeaders(token) });
  },

  async getTpsDetail(token: string, id: number) {
    return fetch(`${API_URL}/dashboard/tps/${id}`, { headers: getAuthHeaders(token) });
  },

  // type kosong = tampilkan DPT dan DPK sekaligus
  async getDpts(token: string, page: number, search = '', tpsId = '', type = '') {
    let url = `${API_URL}/dpt?page=${page}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (tpsId) url += `&tps_id=${tpsId}`;
    if (type) url += `&jenis_pemilih=${type}`;
    return fetch(url, { headers: getAuthHeaders(token) });
  },

  async getQrCode(token: string, nik: string) {
    return fetch(`${API_URL}/dpt/${nik}/qrcode`, { headers: getAuthHeaders(token) });
  },

  async createTps(token: string, nama: string, wilayah: string) {
    return fetch(`${API_URL}/tps`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, wilayah })
    });
  },

  async saveDpt(token: string, payload: any, editingNik?: string) {
    const url = editingNik ? `${API_URL}/dpt/${editingNik}` : `${API_URL}/dpt`;
    const method = editingNik ? 'PUT' : 'POST';
    return fetch(url, {
      method,
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async deleteDpt(token: string, nik: string) {
    return fetch(`${API_URL}/dpt/${nik}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  },

  async importCsv(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return fetch(`${API_URL}/dpt/import`, {
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
    return fetch(url, { headers: getAuthHeaders(token) });
  },

  async createKpps(token: string, payload: any) {
    return fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async resetKppsPassword(token: string, id: number, passwordVal: string) {
    return fetch(`${API_URL}/users/${id}/reset-password`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: passwordVal })
    });
  },

  async deleteKpps(token: string, id: number) {
    return fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  },

  async getPaslons(token: string) {
    return fetch(`${API_URL}/paslon`, { headers: getAuthHeaders(token) });
  },

  async createPaslon(token: string, payload: any) {
    return fetch(`${API_URL}/paslon`, {
      method: 'POST',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async updatePaslon(token: string, id: number, payload: any) {
    return fetch(`${API_URL}/paslon/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  async deletePaslon(token: string, id: number) {
    return fetch(`${API_URL}/paslon/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
  }
};
