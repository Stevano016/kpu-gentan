<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
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
 
        $query = User::with('tps')->where('role', 'kpps');

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
        $this->checkSecretariat($request);

        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:100|unique:users,username',
            'password' => 'required|string|min:6',
            'tps_id' => 'required|exists:tps,id',
            'kpps_role' => 'nullable|string|in:validasi,full',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => 'kpps',
            'kpps_role' => $request->kpps_role ?? 'full',
            'tps_id' => $request->tps_id,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Akun KPPS berhasil dibuat.',
            'data' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
                'kpps_role' => $user->kpps_role,
                'tps_id' => $user->tps_id,
            ]
        ], 201);
    }

    public function resetPassword(Request $request, $id)
    {
        $this->checkSecretariat($request);

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
        $this->checkSecretariat($request);

        $user = User::findOrFail($id);
        
        if ($user->id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Tidak dapat menghapus akun sendiri.'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Akun berhasil dihapus.'
        ]);
    }
}
