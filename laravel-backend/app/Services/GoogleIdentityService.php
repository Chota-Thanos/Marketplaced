<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Verifies a Google ID token.
 *
 * The client sends the ID token it got from Google Sign-In; this confirms with
 * Google that the token is real, unexpired, and issued *for us*. That last
 * check is the one people skip, and skipping it is a full account-takeover:
 * without an `aud` check, an attacker signs into any other app that uses Google
 * Sign-In, takes the ID token it hands them, posts it here, and we hand back a
 * session for whatever email is in it.
 *
 * Verification goes through Google's `tokeninfo` endpoint rather than a local
 * JWKS check. That is a network hop per sign-in, but it needs no crypto
 * dependency and no key-rotation handling. If sign-in volume ever makes the
 * round trip matter, swap the body of `verify()` for local RS256 verification
 * against https://www.googleapis.com/oauth2/v3/certs — the contract this class
 * exposes does not change.
 */
class GoogleIdentityService
{
    private const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

    private const VALID_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

    /** Every OAuth client id that may legitimately mint tokens for us. */
    public function allowedAudiences(): array
    {
        return array_values(array_filter([
            config('services.google.client_id'),
            config('services.google.android_client_id'),
            config('services.google.ios_client_id'),
            config('services.google.web_client_id'),
        ]));
    }

    public function isConfigured(): bool
    {
        return count($this->allowedAudiences()) > 0;
    }

    /**
     * @return array{sub: string, email: string, name: string, picture: ?string, email_verified: bool}
     *
     * @throws \RuntimeException when the token is not valid for this app
     */
    public function verify(string $idToken): array
    {
        if (! $this->isConfigured()) {
            throw new \RuntimeException('Google sign-in is not configured on this server.');
        }

        $response = Http::timeout(6)->retry(2, 200, throw: false)
            ->get(self::TOKENINFO_URL, ['id_token' => $idToken]);

        if ($response->failed()) {
            throw new \RuntimeException('Google could not verify that sign-in. Please try again.');
        }

        $claims = $response->json();

        // Issued for us?
        if (! in_array($claims['aud'] ?? '', $this->allowedAudiences(), true)) {
            Log::warning('[GoogleIdentity] rejected token with foreign audience', [
                'aud' => $claims['aud'] ?? null,
            ]);
            throw new \RuntimeException('That Google sign-in was not issued for this app.');
        }

        // Issued by Google?
        if (! in_array($claims['iss'] ?? '', self::VALID_ISSUERS, true)) {
            throw new \RuntimeException('That sign-in did not come from Google.');
        }

        // Still valid? tokeninfo rejects expired tokens itself, but an explicit
        // check costs nothing and does not depend on that staying true.
        if ((int) ($claims['exp'] ?? 0) < time()) {
            throw new \RuntimeException('That Google sign-in has expired. Please try again.');
        }

        // Google marks unverified addresses on some Workspace domains. Trusting
        // one would let somebody claim an email they do not control.
        $emailVerified = ($claims['email_verified'] ?? 'false') === 'true'
            || ($claims['email_verified'] ?? false) === true;

        if (empty($claims['email']) || ! $emailVerified) {
            throw new \RuntimeException('Your Google account has no verified email address.');
        }

        return [
            'sub' => (string) $claims['sub'],
            'email' => strtolower((string) $claims['email']),
            'name' => (string) ($claims['name'] ?? ''),
            'picture' => $claims['picture'] ?? null,
            'email_verified' => true,
        ];
    }
}
