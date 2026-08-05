<?php

namespace App\Services;

use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Loyalty points ledger. Every mutation writes a row with the resulting
 * balance so the balance on `users` is always reconstructable from history.
 */
class LoyaltyService
{
    /** Points granted per ₹100 spent. */
    public function earnRate(): int
    {
        return (int) Setting::get('loyalty.earn_per_100', 5);
    }

    /** Rupees each point is worth when redeemed. */
    public function redeemValue(): float
    {
        return (float) Setting::get('loyalty.redeem_value', 0.25);
    }

    /** Cap redemption so points can't cover an entire order. */
    public function maxRedeemPercent(): int
    {
        return (int) Setting::get('loyalty.max_redeem_percent', 20);
    }

    public function pointsFor(float $orderTotal): int
    {
        return (int) floor(($orderTotal / 100) * $this->earnRate());
    }

    /** Max points usable against a given order value, in points. */
    public function maxRedeemablePoints(User $user, float $orderTotal): int
    {
        $capRupees = $orderTotal * ($this->maxRedeemPercent() / 100);
        $capPoints = (int) floor($capRupees / max($this->redeemValue(), 0.01));

        return max(0, min($user->loyalty_points, $capPoints));
    }

    public function pointsToRupees(int $points): float
    {
        return round($points * $this->redeemValue(), 2);
    }

    public function credit(User $user, int $points, string $reason, ?Order $order = null): ?LoyaltyTransaction
    {
        if ($points <= 0) {
            return null;
        }

        return DB::transaction(function () use ($user, $points, $reason, $order) {
            $locked = User::whereKey($user->id)->lockForUpdate()->first();
            $balance = $locked->loyalty_points + $points;
            $locked->forceFill(['loyalty_points' => $balance])->save();

            return LoyaltyTransaction::create([
                'user_id' => $locked->id,
                'type' => 'EARN',
                'points' => $points,
                'balance_after' => $balance,
                'reason' => $reason,
                'order_id' => $order?->id,
            ]);
        });
    }

    /** Throws if the user doesn't actually have the points. */
    public function redeem(User $user, int $points, string $reason, ?Order $order = null): LoyaltyTransaction
    {
        return DB::transaction(function () use ($user, $points, $reason, $order) {
            $locked = User::whereKey($user->id)->lockForUpdate()->first();

            if ($points <= 0 || $points > $locked->loyalty_points) {
                throw new \RuntimeException('Insufficient loyalty points.');
            }

            $balance = $locked->loyalty_points - $points;
            $locked->forceFill(['loyalty_points' => $balance])->save();

            return LoyaltyTransaction::create([
                'user_id' => $locked->id,
                'type' => 'REDEEM',
                'points' => -$points,
                'balance_after' => $balance,
                'reason' => $reason,
                'order_id' => $order?->id,
            ]);
        });
    }
}
