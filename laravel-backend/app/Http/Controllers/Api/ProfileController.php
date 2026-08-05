<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['status' => 'success', 'data' => $request->user()]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'avatar' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json(['status' => 'success', 'data' => $user->fresh()]);
    }

    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            return response()->json(['status' => 'error', 'message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => $validated['new_password']]);

        return response()->json(['status' => 'success', 'message' => 'Password updated']);
    }

    public function notificationPreferences(Request $request)
    {
        $validated = $request->validate([
            'preferences' => 'required|array',
            'preferences.*' => 'boolean',
        ]);

        $request->user()->update(['notification_preferences' => $validated['preferences']]);

        return response()->json([
            'status' => 'success',
            'data' => $request->user()->fresh()->notification_preferences,
        ]);
    }
}
