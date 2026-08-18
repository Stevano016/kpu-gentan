# -*- coding: utf-8 -*-
"""
Membangun `database/seeders/dpt_seed.csv` dari berkas DP4
`Data_Utama_Bersih (999) (1).xlsx` (sheet "Data Utama (Bersih)").

Seluruh 7.494 baris ikut masuk, tidak ada yang dibuang. Dua hal yang dulu
membuat sebagian baris hilang ditangani di sini, bukan didiamkan:

1.  **627 baris tanpa NIK/NKK.** Kolom `NIK` pada berkas itu tersamar
    (`317308**********`) sehingga tidak bisa dipakai; NIK asli hanya ada di
    `NIK_PEMBANDING`, dan 627 orang tidak menemukan padanannya. Karena `nik`
    adalah primary key tabel `dpt`, mereka dulu tidak bisa dimasukkan sama
    sekali. Sekarang mereka diberi nomor sementara buatan sistem dan ditandai
    lewat kolom `nik_sintetis` / `nkk_sintetis`, jadi datanya ada tapi tidak
    pernah tertukar dengan nomor asli.

2.  **11 NIK kembar.** Dua orang berbeda (tanggal lahir dan alamat berbeda)
    terlanjur dipetakan ke satu NIK. Baris pertama memakai NIK aslinya, baris
    berikutnya dapat nomor sementara + catatan, jadi orangnya tetap terdata
    alih-alih dibuang diam-diam.

Nomor sementara sengaja dibuat berawalan 9999 (NIK) dan 9998 (NKK) — bukan
kode provinsi yang sah, jadi mustahil bentrok dengan nomor asli dan langsung
kelihatan palsu saat dibaca manusia. Urutannya deterministik supaya seed ulang
menghasilkan berkas yang sama persis.

Pakai:  python database/seeders/tools/bangun_dpt_seed.py [path/ke/berkas.xlsx]
"""

import csv
import sys
from pathlib import Path

import openpyxl

AKAR = Path(__file__).resolve().parents[3].parent  # .../KPPS Gentan
SUMBER_BAWAAN = AKAR / "Data_Utama_Bersih (999) (1).xlsx"
TUJUAN = Path(__file__).resolve().parents[1] / "dpt_seed.csv"
SHEET = "Data Utama (Bersih)"

AWALAN_NIK_SINTETIS = "9999"
AWALAN_NKK_SINTETIS = "9998"

# Pembagian wilayah TPS, disalin dari surat pembagian TPS Kelurahan Gentan.
# Kunci = RW; nilainya None berarti seluruh RT masuk TPS itu, selain itu daftar
# RT yang masuk.
PETA_TPS = {
    1: {"001": None, "002": None, "010": ["006", "007"]},
    2: {"003": None, "004": None, "014": None, "006": ["002", "004", "006", "008"]},
    3: {"007": None, "013": None, "006": ["001", "003", "005", "007"], "009": ["001"]},
    4: {"008": None, "012": None},
    5: {"005": None, "011": None,
        "009": ["002", "003", "004", "005"],
        "010": ["001", "002", "003", "004", "005"]},
}
TPS_CADANGAN = 1  # RT/RW kosong (perumahan yang tidak terdaftar RT-nya)

KOLOM_KELUARAN = [
    "nik", "nkk", "nama", "tps_id", "jenis_kelamin", "umur", "status_kawin",
    "alamat", "rt", "rw", "pekerjaan", "disabilitas", "catatan_impor",
    "nik_sintetis", "nkk_sintetis",
]


def teks(nilai) -> str:
    """Semua sel dibaca sebagai teks. NIK 16 digit melebihi presisi float dan
    akan kehilangan digit terakhir kalau sempat menjadi angka."""
    if nilai is None:
        return ""
    if isinstance(nilai, float) and nilai.is_integer():
        nilai = int(nilai)
    return str(nilai).strip()


def nomor_wilayah(nilai: str) -> str:
    """`1`, `0001`, dan `001` adalah RT yang sama; `-` berarti kosong."""
    nilai = teks(nilai)
    if not nilai or nilai == "-":
        return ""
    return nilai.lstrip("0").zfill(3) if nilai.isdigit() else nilai


def cari_tps(rw: str, rt: str) -> int:
    for tps_id, wilayah in PETA_TPS.items():
        if rw in wilayah:
            daftar_rt = wilayah[rw]
            if daftar_rt is None or rt in daftar_rt:
                return tps_id
    return TPS_CADANGAN


def main() -> int:
    sumber = Path(sys.argv[1]) if len(sys.argv) > 1 else SUMBER_BAWAAN
    if not sumber.exists():
        print(f"Berkas sumber tidak ditemukan: {sumber}")
        return 1

    wb = openpyxl.load_workbook(sumber, read_only=True, data_only=True)
    ws = wb[SHEET]
    baris = ws.iter_rows(values_only=True)
    judul = [teks(h) for h in next(baris)]
    kolom = {nama: i for i, nama in enumerate(judul)}

    def sel(baris_data, nama):
        return teks(baris_data[kolom[nama]])

    hasil = []
    nik_terpakai = set()
    urut_nik_sintetis = 0
    urut_nkk_sintetis = 0
    jumlah = {"total": 0, "nik_sintetis": 0, "nkk_sintetis": 0, "nik_kembar": 0}

    for data in baris:
        if not any(teks(v) for v in data):
            continue
        jumlah["total"] += 1

        nik = sel(data, "NIK_PEMBANDING")
        nkk = sel(data, "NKK_PEMBANDING")
        catatan = [c for c in [sel(data, "KETERANGAN")] if c]

        nik_sintetis = False
        nkk_sintetis = False

        if nik and nik in nik_terpakai:
            # Dua orang berbeda dipetakan ke satu NIK di berkas sumber.
            catatan.append(
                f"NIK {nik} sudah dipakai baris lain (dugaan data ganda); "
                "nomor sementara dibuat sistem agar orangnya tetap terdata."
            )
            jumlah["nik_kembar"] += 1
            nik = ""

        if not nik:
            urut_nik_sintetis += 1
            nik = AWALAN_NIK_SINTETIS + str(urut_nik_sintetis).zfill(12)
            nik_sintetis = True
            jumlah["nik_sintetis"] += 1
            catatan.append("NIK belum ada di data pembanding — nomor sementara, wajib dilengkapi pantarlih.")

        if not nkk:
            urut_nkk_sintetis += 1
            nkk = AWALAN_NKK_SINTETIS + str(urut_nkk_sintetis).zfill(12)
            nkk_sintetis = True
            jumlah["nkk_sintetis"] += 1
            catatan.append("NKK belum ada di data pembanding — nomor sementara, keluarganya belum bisa dikelompokkan.")

        nik_terpakai.add(nik)

        rt = nomor_wilayah(sel(data, "NO_RT_ALT")) or nomor_wilayah(sel(data, "NO_RT")) or "000"
        rw = nomor_wilayah(sel(data, "NO_RW_ALT")) or nomor_wilayah(sel(data, "NO_RW")) or "000"

        umur = sel(data, "UMUR")
        hasil.append({
            "nik": nik,
            "nkk": nkk,
            "nama": sel(data, "NAMA_LGKP"),
            "tps_id": cari_tps(rw, rt),
            "jenis_kelamin": sel(data, "JENIS_KLMIN_KET"),
            "umur": umur if umur.isdigit() else "",
            "status_kawin": sel(data, "STAT_KWN"),
            "alamat": sel(data, "ALAMAT"),
            "rt": rt,
            "rw": rw,
            "pekerjaan": sel(data, "JENIS_PKRJN_KET"),
            "disabilitas": sel(data, "PNYDNG_CCT_KET"),
            "catatan_impor": " | ".join(catatan),
            "nik_sintetis": "1" if nik_sintetis else "0",
            "nkk_sintetis": "1" if nkk_sintetis else "0",
        })

    # Urutan berkas menentukan urutan id_pemilih (USH-GTN-026xxxx), jadi dibuat
    # menetap: per TPS, lalu RW/RT, lalu nama.
    hasil.sort(key=lambda b: (b["tps_id"], b["rw"], b["rt"], b["nama"], b["nik"]))

    with TUJUAN.open("w", encoding="utf-8", newline="") as f:
        penulis = csv.DictWriter(f, fieldnames=KOLOM_KELUARAN)
        penulis.writeheader()
        penulis.writerows(hasil)

    print(f"Ditulis ke {TUJUAN}")
    print(f"  baris          : {jumlah['total']}")
    print(f"  NIK sementara  : {jumlah['nik_sintetis']} (termasuk {jumlah['nik_kembar']} NIK kembar)")
    print(f"  NKK sementara  : {jumlah['nkk_sintetis']}")
    per_tps = {}
    for b in hasil:
        per_tps[b["tps_id"]] = per_tps.get(b["tps_id"], 0) + 1
    for t in sorted(per_tps):
        print(f"  TPS {t}          : {per_tps[t]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
