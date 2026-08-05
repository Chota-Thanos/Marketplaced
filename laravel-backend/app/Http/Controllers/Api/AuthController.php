<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\GoogleIdentityService;
use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|unique:users,phone',
            'password' => 'required|string|min:8',
            'referral_code' => 'nullable|string|max:32',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'CUSTOMER',
        ]);

        // `status` is deliberately not mass-assignable, so the insert falls
        // through to the column default and the in-memory model still has it as
        // null. Without this reload the API hands back a user whose status is
        // null — the same defect that made phone-OTP signup reject itself.
        $user->refresh();

        $referrals = app(ReferralService::class);
        $referrals->ensureCode($user);

        // Recorded now, but neither side is paid until this user's first order.
        if (! empty($validated['referral_code'])) {
            $referrals->attach($user, $validated['referral_code']);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'data' => ['user' => $user->fresh(), 'token' => $token],
        ], 201);
    }

    /**
     * Sign in (or sign up) with a Google ID token.
     *
     * Deliberately one endpoint, not two: from the user's side "sign in with
     * Google" is a single action, and making them pick sign-in vs sign-up first
     * is the friction the button exists to remove.
     *
     * Account linking is by verified email, and only in one direction: an
     * existing password account gains a Google identity, but a Google account
     * never gains a password. Somebody who signs up with Google and later wants
     * a password goes through the reset flow, which proves the mailbox again.
     */
    public function google(Request $request, GoogleIdentityService $google, ReferralService $referrals)
    {
        $validated = $request->validate([
            'id_token' => 'required|string',
            'referral_code' => 'nullable|string|max:32',
        ]);

        try {
            $profile = $google->verify($validated['id_token']);
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['id_token' => [$e->getMessage()]]);
        }

        $user = User::where('google_id', $profile['sub'])->first();

        if (! $user) {
            // No Google identity yet. If the verified email already has an
            // account, attach to it rather than creating a duplicate — two
            // accounts on one email is how order history goes missing.
            $user = User::whereRaw('LOWER(email) = ?', [$profile['email']])->first();

            if ($user) {
                $user->forceFill([
                    'google_id' => $profile['sub'],
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();
            } else {
                $user = User::create([
                    'name' => $profile['name'] !== '' ? $profile['name'] : 'Customer',
                    'email' => $profile['email'],
                    'avatar' => $profile['picture'],
                ]);

                // password stays null, and status/verification are not
                // mass-assignable — the same guard that silently broke OTP
                // signup, so they are set explicitly here.
                $user->forceFill([
                    'google_id' => $profile['sub'],
                    'auth_provider' => 'GOOGLE',
                    'email_verified_at' => now(),
                    'status' => 'ACTIVE',
                    'role' => 'CUSTOMER',
                ])->save();

                $referrals->ensureCode($user);

                if (! empty($validated['referral_code'])) {
                    $referrals->attach($user, $validated['referral_code']);
                }
            }
        }

        if ($user->status !== 'ACTIVE') {
            throw ValidationException::withMessages(['email' => ['This account has been blocked.']]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'data' => ['user' => $user->fresh(), 'token' => $token],
        ]);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'ACTIVE') {
            throw ValidationException::withMessages([
                'email' => ['This account has been blocked.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'data' => ['user' => $user, 'token' => $token],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['status' => 'success', 'message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return response()->json(['status' => 'success', 'data' => $request->user()]);
    }

    public function sendOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string|regex:/^[0-9]{10}$/',
        ]);

        // random_int(), not rand() — rand() is seeded and predictable, which
        // would let an attacker who has seen one OTP derive the next.
        $otp = (string) random_int(100000, 999999);
        \Illuminate\Support\Facades\Cache::put('otp_' . $validated['phone'], $otp, now()->addMinutes(5));

        // Mock sending SMS via NotificationService
        app(\App\Services\NotificationService::class)->sendSmsToPhone(
            $validated['phone'],
            'Your ' . config('app.name') . " login OTP is: {$otp}. Valid for 5 minutes."
        );

        return response()->json([
            'status' => 'success',
            'message' => 'OTP sent successfully (Check logs for mock SMS)'
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'phone' => 'required|string|regex:/^[0-9]{10}$/',
            'otp' => 'required|string|size:6',
        ]);

        $cachedOtp = \Illuminate\Support\Facades\Cache::get('otp_' . $validated['phone']);

        // hash_equals, not != — constant-time, so response latency can't be used
        // to narrow the code down digit by digit.
        if (! $cachedOtp || ! hash_equals((string) $cachedOtp, $validated['otp'])) {
            throw ValidationException::withMessages([
                'otp' => ['Invalid or expired OTP.'],
            ]);
        }

        \Illuminate\Support\Facades\Cache::forget('otp_' . $validated['phone']);

        // Find or create user
        $user = User::firstOrCreate(
            ['phone' => $validated['phone']],
            [
                'name' => 'User ' . substr($validated['phone'], -4),
                'email' => $validated['phone'] . '@example.com', // Dummy email as it's required
                'password' => Hash::make(uniqid()),
                'role' => 'CUSTOMER',
            ]
        );

        if ($user->wasRecentlyCreated) {
            // `status` is deliberately not mass-assignable, so the insert falls
            // through to the column default ('ACTIVE') and the in-memory model
            // still has it as null. Without this reload the check below rejects
            // every brand-new phone signup as "blocked".
            $user->refresh();

            // Same code issuance the email/password path does, so OTP signups
            // aren't silently excluded from the referral programme.
            app(ReferralService::class)->ensureCode($user);
        }

        if ($user->status !== 'ACTIVE') {
            throw ValidationException::withMessages([
                'phone' => ['This account has been blocked.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'data' => ['user' => $user, 'token' => $token],
        ]);
    }
}
