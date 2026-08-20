/**
 * Pembungkus tipis di sekitar `fetch` milik `ApiService`.
 *
 * Setiap layar dulunya menulis ulang blok try/catch + `res.json()` yang sama,
 * dan perbedaan kecil di antaranya (ada yang menelan galat, ada yang tidak)
 * membuat perilakunya tidak seragam. Dua fungsi di bawah memisahkan dua pola
 * yang benar-benar ada: menarik data, dan menjalankan aksi tulis.
 */

/** Badan respons yang tidak berisi JSON tidak boleh menjatuhkan pemanggilnya. */
export const bacaJson = async (res: Response): Promise<any> =>
  await res.json().catch(() => ({}));

/**
 * Menarik isi `data` dari endpoint pembacaan.
 *
 * `null` berarti gagal — entah server menolak atau jaringannya mati. Pembacaan
 * yang gagal memang dibiarkan senyap: layarnya tetap menampilkan data lama,
 * yang jauh lebih berguna daripada tabel kosong beserta modal galat.
 */
export async function ambilData<T>(panggil: () => Promise<Response>): Promise<T | null> {
  try {
    const res = await panggil();
    const json = await bacaJson(res);
    return res.ok ? ((json.data ?? null) as T | null) : null;
  } catch {
    return null;
  }
}

/** Hasil aksi tulis; `null` khusus untuk "server tidak bisa dihubungi". */
export interface HasilAksi {
  ok: boolean;
  json: any;
}

/**
 * Menjalankan aksi tulis dan mengembalikan status beserta badan responsnya,
 * supaya pemanggilnya bisa memilih pesan galat yang tepat.
 */
export async function jalankanAksi(panggil: () => Promise<Response>): Promise<HasilAksi | null> {
  try {
    const res = await panggil();
    return { ok: res.ok, json: await bacaJson(res) };
  } catch {
    return null;
  }
}
