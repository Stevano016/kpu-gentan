<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paslon;
use Illuminate\Support\Facades\Validator;
use App\Utils\Broadcaster;

class PaslonController extends Controller
{
    /**
     * Get list of all candidates (paslon).
     */
    public function index()
    {
        $paslons = Paslon::orderBy('nomor_urut', 'asc')->get();
        return response()->json([
            'status' => 'success',
            'data' => $paslons
        ]);
    }

    /**
     * Create a new candidate (paslon).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nomor_urut' => 'required|integer|min:1|unique:paslons,nomor_urut',
            'nama_ketua' => 'required|string|max:255',
            'nama_wakil' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $paslon = Paslon::create([
            'nomor_urut' => $request->nomor_urut,
            'nama_ketua' => $request->nama_ketua,
            'nama_wakil' => $request->nama_wakil,
        ]);

        // Broadcast change to WebSocket clients
        Broadcaster::trigger('paslon_updated');

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil menambahkan pasangan calon.',
            'data' => $paslon
        ], 211);
    }

    /**
     * Update candidate (paslon).
     */
    public function update(Request $request, $id)
    {
        $paslon = Paslon::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nomor_urut' => 'required|integer|min:1|unique:paslons,nomor_urut,' . $id,
            'nama_ketua' => 'required|string|max:255',
            'nama_wakil' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $paslon->update([
            'nomor_urut' => $request->nomor_urut,
            'nama_ketua' => $request->nama_ketua,
            'nama_wakil' => $request->nama_wakil,
        ]);

        // Broadcast change to WebSocket clients
        Broadcaster::trigger('paslon_updated');

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil memperbarui data pasangan calon.',
            'data' => $paslon
        ]);
    }

    /**
     * Delete candidate (paslon).
     */
    public function destroy($id)
    {
        $paslon = Paslon::findOrFail($id);
        $paslon->delete();

        // Broadcast change to WebSocket clients
        Broadcaster::trigger('paslon_updated');

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil menghapus pasangan calon.'
        ]);
    }
}
