<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
                'kpps_role' => $user->kpps_role,
                'tps_id' => $user->tps_id,
            ]
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Berhasil logout.'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'user' => [
                'id' => $request->user()->id,
                'username' => $request->user()->username,
                'role' => $request->user()->role,
                'kpps_role' => $request->user()->kpps_role,
                'tps_id' => $request->user()->tps_id,
            ]
        ]);
    }
}
