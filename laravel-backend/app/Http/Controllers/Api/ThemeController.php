<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

/**
 * Runtime theme overrides.
 *
 * The design tokens in `packages/tokens` are the defaults, compiled into CSS
 * variables at build time. This lets an admin override individual tokens
 * without a deploy — the storefront reads them and emits a `<style>` block that
 * re-points the same variables, so an override lands everywhere the token is
 * used, on web and mobile, with no component changes.
 *
 * Only overrides are stored, never the whole palette. That matters: if a future
 * token change ships a new default, unedited tokens pick it up, and only the
 * ones an admin has deliberately changed stay pinned. Storing a full snapshot
 * would silently freeze the entire design system at whatever it looked like the
 * day someone first opened this page.
 *
 * Reachable by sub-admins — appearance is store operations, not access control.
 */
class ThemeController extends Controller
{
    private const KEY_COLORS = 'theme.colors';
    private const KEY_COLORS_DARK = 'theme.colors_dark';
    private const KEY_GEOMETRY = 'theme.geometry';
    private const KEY_BRAND = 'theme.brand';

    /** Token names an admin may override, grouped as the UI presents them. */
    public const COLOR_GROUPS = [
        'Surfaces' => ['canvas', 'surface', 'surface-muted', 'surface-sunken', 'inverse'],
        'Text' => ['ink', 'ink-muted', 'ink-subtle', 'ink-inverse'],
        'Lines' => ['line', 'line-strong'],
        'Brand' => ['primary', 'primary-hover', 'on-primary', 'accent', 'accent-hover',
            'accent-soft', 'on-accent', 'highlight', 'highlight-hover', 'on-highlight'],
        'Status' => ['success', 'success-soft', 'warning', 'warning-soft',
            'danger', 'danger-hover', 'danger-soft', 'info', 'info-soft'],
        'Commerce' => ['sale', 'new', 'rating'],
    ];

    public const GEOMETRY_KEYS = [
        'radius-chip', 'radius-control', 'radius-card', 'radius-panel',
    ];

    public static function allowedColorTokens(): array
    {
        return array_merge(...array_values(self::COLOR_GROUPS));
    }

    /**
     * Public — the storefront needs this before first paint, and it contains
     * nothing sensitive. Cached by the Setting model, so this is not a query
     * per page load.
     */
    public function show()
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'colors' => (array) Setting::get(self::KEY_COLORS, []),
                'colors_dark' => (array) Setting::get(self::KEY_COLORS_DARK, []),
                'geometry' => (array) Setting::get(self::KEY_GEOMETRY, []),
                'brand' => (array) Setting::get(self::KEY_BRAND, []),
            ],
        ]);
    }

    /** Admin view: overrides plus the vocabulary the editor renders from. */
    public function schema()
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'color_groups' => self::COLOR_GROUPS,
                'geometry_keys' => self::GEOMETRY_KEYS,
                'brand_keys' => ['name', 'nameDisplay', 'nameAccent', 'logoInitials',
                    'tagline', 'supportEmail', 'legalEntity'],
                'overrides' => [
                    'colors' => (array) Setting::get(self::KEY_COLORS, []),
                    'colors_dark' => (array) Setting::get(self::KEY_COLORS_DARK, []),
                    'geometry' => (array) Setting::get(self::KEY_GEOMETRY, []),
                    'brand' => (array) Setting::get(self::KEY_BRAND, []),
                ],
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'colors' => 'nullable|array',
            'colors_dark' => 'nullable|array',
            'geometry' => 'nullable|array',
            'brand' => 'nullable|array',
            'brand.*' => 'nullable|string|max:120',
        ]);

        if ($request->has('colors')) {
            Setting::put(self::KEY_COLORS, $this->sanitiseColors($validated['colors'] ?? []));
        }

        if ($request->has('colors_dark')) {
            Setting::put(self::KEY_COLORS_DARK, $this->sanitiseColors($validated['colors_dark'] ?? []));
        }

        if ($request->has('geometry')) {
            Setting::put(self::KEY_GEOMETRY, $this->sanitiseGeometry($validated['geometry'] ?? []));
        }

        if ($request->has('brand')) {
            Setting::put(self::KEY_BRAND, array_filter(
                $validated['brand'] ?? [],
                fn ($v) => is_string($v) && trim($v) !== '',
            ));
        }

        return $this->show();
    }

    /** Clears every override and falls back to the shipped tokens. */
    public function reset(Request $request)
    {
        $scope = $request->input('scope', 'all');

        $keys = match ($scope) {
            'colors' => [self::KEY_COLORS, self::KEY_COLORS_DARK],
            'geometry' => [self::KEY_GEOMETRY],
            'brand' => [self::KEY_BRAND],
            default => [self::KEY_COLORS, self::KEY_COLORS_DARK, self::KEY_GEOMETRY, self::KEY_BRAND],
        };

        foreach ($keys as $key) {
            Setting::put($key, []);
        }

        return $this->show();
    }

    /**
     * Only known token names, only 6-digit hex.
     *
     * The values here are interpolated into a `<style>` block on every page, so
     * an unchecked string is stored XSS — `red;} body{display:none` would be
     * enough. Allow-listing the names as well as the format means a compromised
     * admin session cannot invent CSS variables either.
     */
    private function sanitiseColors(array $input): array
    {
        $allowed = self::allowedColorTokens();
        $clean = [];

        foreach ($input as $token => $value) {
            if (! in_array($token, $allowed, true)) {
                continue;
            }

            if (is_string($value) && preg_match('/^#[0-9a-fA-F]{6}$/', $value)) {
                $clean[$token] = strtoupper($value);
            }
        }

        return $clean;
    }

    /** Radii in px, 0–48. Same reasoning as the colours. */
    private function sanitiseGeometry(array $input): array
    {
        $clean = [];

        foreach ($input as $key => $value) {
            if (! in_array($key, self::GEOMETRY_KEYS, true)) {
                continue;
            }

            if (is_numeric($value) && $value >= 0 && $value <= 48) {
                $clean[$key] = (int) $value;
            }
        }

        return $clean;
    }
}
