<?php

namespace App\Http\Controllers;

use App\Models\Tps;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TpsController extends Controller
{
    public function index(Request $request)
    {
        $query = Tps::withCount([
            'dpt', 
            'users',
            'dpt as total_dpt' => function ($q) {
                $q->where('tahapan', 'dpt');
            },
            'dpt as total_dpk' => function ($q) {
                $q->where('tahapan', 'dpk');
            },
            'dpt as hadir_count' => function ($q) {
                $q->where('status_hadir', true);
            }
        ]);

        if ($request->has('page')) {
            $tps = $query->paginate(10);
        } else {
            $tps = $query->get();
        }
 
        return response()->json([
            'status' => 'success',
            'data' => $tps
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama' => 'required|string|max:100|unique:tps,nama',
            'wilayah' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $tps = Tps::create([
            'nama' => $request->nama,
            'wilayah' => $request->wilayah,
            'total_dpt' => 0
        ]);

        // Dashboard menghitung "dari N total TPS" dan "TPS belum kirim QC"
        // dari jumlah TPS, jadi penambahan satu TPS menggeser dua kartu di
        // sana. Tanpa siaran ini, layar monitor lain tetap menampilkan angka
        // lama sampai seseorang menekan Segarkan — satu-satunya perubahan
        // data yang dulu tidak ikut disiarkan.
        \App\Utils\Broadcaster::trigger('update', ['tps_id' => 'all']);

        return response()->json([
            'status' => 'success',
            'message' => 'TPS berhasil dibuat.',
            'data' => $tps
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $tps = Tps::with(['quickCount', 'users'])->findOrFail($id);
        
        $totalDptOnly = $tps->dpt()->where('tahapan', 'dpt')->count();
        $totalDpkOnly = $tps->dpt()->where('tahapan', 'dpk')->count();
        $attendanceCount = $tps->dpt()->where('status_hadir', true)->count();
        $totalPemilih = $tps->dpt()->count();

        $paslons = \App\Models\Paslon::orderBy('nomor_urut')->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'tps' => $tps,
                'stats' => [
                    'total_dpt' => $totalDptOnly,
                    'total_dpk' => $totalDpkOnly,
                    'total_pemilih' => $totalPemilih,
                    'hadir' => $attendanceCount,
                    'tidak_hadir' => $totalPemilih - $attendanceCount,
                    'persentase_kehadiran' => $totalPemilih > 0 ? round(($attendanceCount / $totalPemilih) * 100, 2) : 0
                ],
                'paslons' => $paslons
            ]
        ]);
    }
}
