<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('tps')->orderBy('role')->orderBy('username');

        // Filter opsional: ?role=kpps atau ?role=sekretariat
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('page')) {
            $users = $query->paginate(10);
        } else {
            $users = $query->get();
        }

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:100|unique:users,username',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:kpps,sekretariat,pantarlih',
            // TPS & hak akses hanya relevan untuk akun KPPS
            'tps_id' => 'required_if:role,kpps|nullable|exists:tps,id',
            // RW tugas hanya relevan untuk akun Pantarlih
            'rw' => 'required_if:role,pantarlih|nullable|string|max:10',
            'kpps_role' => 'nullable|string|in:validasi,full',
            // admin = akses penuh, viewer = hanya lihat
            'sekretariat_role' => 'required_if:role,sekretariat|nullable|string|in:admin,viewer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $isKpps = $request->role === 'kpps';
        $isSekretariat = $request->role === 'sekretariat';
        $isPantarlih = $request->role === 'pantarlih';

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'kpps_role' => $isKpps ? ($request->kpps_role ?? 'full') : null,
            'sekretariat_role' => $isSekretariat ? $request->sekretariat_role : null,
            'tps_id' => $isKpps ? $request->tps_id : null,
            'rw' => $isPantarlih ? $request->rw : null,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => match ($request->role) {
                'kpps' => 'Akun KPPS berhasil dibuat.',
                'pantarlih' => 'Akun Pantarlih berhasil dibuat.',
                default => 'Akun Sekretariat berhasil dibuat.',
            },
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
                'kpps_role' => $user->kpps_role,
                'sekretariat_role' => $user->sekretariat_role,
                'tps_id' => $user->tps_id,
                'rw' => $user->rw,
            ]
        ], 201);
    }

    public function resetPassword(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Password untuk user {$user->username} berhasil di-reset."
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        if ($user->id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menghapus akun sendiri.'
            ], 400);
        }

        // Jangan sampai tidak ada admin sekretariat tersisa
        if ($user->isSekretariatAdmin()) {
            $remainingAdmins = User::where('role', 'sekretariat')
                ->where(function ($q) {
                    $q->where('sekretariat_role', '!=', 'viewer')
                        ->orWhereNull('sekretariat_role');
                })
                ->where('id', '!=', $user->id)
                ->count();

            if ($remainingAdmins === 0) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Tidak dapat menghapus admin sekretariat terakhir.'
                ], 400);
            }
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Akun berhasil dihapus.'
        ]);
    }
}
