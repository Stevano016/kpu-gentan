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
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
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
            'foto' => $this->simpanFoto($request),
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
            'foto' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validasi gagal',
                'errors' => $validator->errors()
            ], 422);
        }

        $fotoBaru = $this->simpanFoto($request);
        if ($fotoBaru) {
            // Foto lama tidak lagi dirujuk siapa pun; membiarkannya hanya
            // menumpuk berkas yatim di disk.
            $this->hapusFoto($paslon->foto);
        }

        $paslon->update([
            'nomor_urut' => $request->nomor_urut,
            'nama_ketua' => $request->nama_ketua,
            'foto' => $fotoBaru ?? $paslon->foto,
        ]);

        // Broadcast change to WebSocket clients
        Broadcaster::trigger('paslon_updated');

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil memperbarui data pasangan calon.',
            'data' => $paslon
        ]);
    }

    /** Simpan berkas foto bila ada, kembalikan path relatifnya. */
    private function simpanFoto(Request $request): ?string
    {
        if (!$request->hasFile('foto')) {
            return null;
        }

        return $request->file('foto')->store('paslon', 'public');
    }

    private function hapusFoto(?string $path): void
    {
        if ($path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
        }
    }

    /**
     * Delete candidate (paslon).
     */
    public function destroy($id)
    {
        $paslon = Paslon::findOrFail($id);
        $this->hapusFoto($paslon->foto);
        $paslon->delete();

        // Broadcast change to WebSocket clients
        Broadcaster::trigger('paslon_updated');

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil menghapus pasangan calon.'
        ]);
    }
}
