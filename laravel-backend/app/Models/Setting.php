<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Key/value platform settings so admins can change business rules (loyalty
 * rates, referral rewards, COD policy) without a deploy.
 */
class Setting extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    protected $casts = ['value' => 'array'];

    private const CACHE_KEY = 'settings.all';

    public static function allSettings(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, fn () => static::query()->pluck('value', 'key')->all());
    }

    public static function get(string $key, $default = null)
    {
        $all = static::allSettings();

        // Values are stored JSON-encoded; scalars come back wrapped so that
        // {"v": 5} and 5 both round-trip predictably.
        if (! array_key_exists($key, $all)) {
            return $default;
        }

        $value = $all[$key];

        return is_array($value) && array_key_exists('v', $value) ? $value['v'] : $value;
    }

    public static function put(string $key, $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => ['v' => $value]]);
        Cache::forget(self::CACHE_KEY);
    }

    protected static function booted(): void
    {
        static::saved(fn () => Cache::forget(self::CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::CACHE_KEY));
    }
}
