<?php

namespace App\Http\Controllers;

use App\Models\Tps;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TpsController extends Controller
{
    private function checkSecretariat(Request $request)
    {
        if ($request->user()->role !== 'sekretariat') {
            abort(response()->json([
                'status' => 'error',
                'message' => 'Akses ditolak. Hanya Sekretariat yang diizinkan.'
            ], 403));
        }
    }

    public function index(Request $request)
    {
        $this->checkSecretariat($request);

        $tps = Tps::withCount([
            'dpt', 
            'users',
            'dpt as hadir_count' => function ($query) {
                $query->where('status_hadir', true);
            }
        ])->get();

        return response()->json([
            'status' => 'success',
            'data' => $tps
        ]);
    }

    public function store(Request $request)
    {
        $this->checkSecretariat($request);

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

        return response()->json([
            'status' => 'success',
            'message' => 'TPS berhasil dibuat.',
            'data' => $tps
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $this->checkSecretariat($request);

        $tps = Tps::with(['quickCount', 'users'])->findOrFail($id);
        
        // Eager load DPT with pagination if needed, but for details let's just return basic info and statistics
        $attendanceCount = $tps->dpt()->where('status_hadir', true)->count();
        $totalDpt = $tps->dpt()->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'tps' => $tps,
                'stats' => [
                    'total_dpt' => $totalDpt,
                    'hadir' => $attendanceCount,
                    'tidak_hadir' => $totalDpt - $attendanceCount,
                    'persentase_kehadiran' => $totalDpt > 0 ? round(($attendanceCount / $totalDpt) * 100, 2) : 0
                ]
            ]
        ]);
    }
}
