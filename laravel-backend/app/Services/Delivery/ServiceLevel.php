<?php

namespace App\Services\Delivery;

/**
 * The promise made to the customer, independent of who fulfils it.
 *
 * Carriers are an implementation detail — a customer picks "in 2 hours", not
 * "Rapido". Keeping the vocabulary at this level is what lets the allocator
 * swap Rapido for Ola mid-day on price or availability without the storefront,
 * the mobile app or the order history changing at all.
 */
final class ServiceLevel
{
    /** Intracity, rider-based, under ~2 hours. */
    public const INSTANT = 'INSTANT';

    /** Same city, same day. */
    public const SAME_DAY = 'SAME_DAY';

    /** Next-day, usually air for metro pairs. */
    public const EXPRESS = 'EXPRESS';

    /** 3–5 day surface. The default. */
    public const STANDARD = 'STANDARD';

    /** Trucks, white-goods, furniture. Scheduled, not next-day. */
    public const HEAVY = 'HEAVY';

    public const ALL = [self::INSTANT, self::SAME_DAY, self::EXPRESS, self::STANDARD, self::HEAVY];

    public static function label(string $level): string
    {
        return match ($level) {
            self::INSTANT => 'Instant delivery',
            self::SAME_DAY => 'Same-day delivery',
            self::EXPRESS => 'Express delivery',
            self::HEAVY => 'Heavy / bulky delivery',
            default => 'Standard delivery',
        };
    }

    public static function description(string $level): string
    {
        return match ($level) {
            self::INSTANT => 'A rider collects from the nearest store and brings it straight to you.',
            self::SAME_DAY => 'Ordered before the daily cut-off, delivered by tonight.',
            self::EXPRESS => 'Air-lifted overnight to metro destinations.',
            self::HEAVY => 'Scheduled slot with a vehicle sized for the item.',
            default => 'Surface delivery, 3–5 business days.',
        };
    }

    /**
     * Fastest first — used to sort the options the customer sees.
     *
     * `?:` would be wrong here: INSTANT is index 0, and 0 is falsy, so the
     * fastest option would fall through to the unknown-rank value and sort
     * last. An explicit false check is the only correct form.
     */
    public static function rank(string $level): int
    {
        $index = array_search($level, self::ALL, true);

        return $index === false ? 99 : $index;
    }
}
