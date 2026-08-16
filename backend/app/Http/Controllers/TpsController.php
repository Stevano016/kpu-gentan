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

        return response()->json([
            'status' => 'success',
            'message' => 'TPS berhasil dibuat.',
            'data' => $tps
        ], 201);
    }

    public function show(Request $request, $id)
    {
        $tps = Tps::with(['quickCount', 'users'])->findOrFail($id);
        
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
