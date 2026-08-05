<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Referral;
use App\Models\Setting;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * "Invite & Earn". A referral is recorded at signup but only pays out once
 * the referee completes their first order, so codes can't be farmed.
 */
class ReferralService
{
    public function referrerReward(): float
    {
        return (float) Setting::get('referral.referrer_reward', 100);
    }

    public function refereeReward(): float
    {
        return (float) Setting::get('referral.referee_reward', 50);
    }

    /** Idempotent — returns the existing code if the user already has one. */
    public function ensureCode(User $user): string
    {
        if ($user->referral_code) {
            return $user->referral_code;
        }

        do {
            $code = strtoupper(Str::of($user->name ?? 'BX')->substr(0, 3)->append(Str::random(5)));
        } while (User::where('referral_code', $code)->exists());

        $user->forceFill(['referral_code' => $code])->save();

        return $code;
    }

    /** Called at registration when the new user supplied someone's code. */
    public function attach(User $referee, string $code): ?Referral
    {
        $referrer = User::where('referral_code', strtoupper(trim($code)))->first();

        // Can't refer yourself, use an unknown code, or be referred twice.
        if (! $referrer || $referrer->id === $referee->id || Referral::where('referee_id', $referee->id)->exists()) {
            return null;
        }

        return Referral::create([
            'referrer_id' => $referrer->id,
            'referee_id' => $referee->id,
            'code' => $referrer->referral_code,
            'status' => 'PENDING',
            'referrer_reward' => $this->referrerReward(),
            'referee_reward' => $this->refereeReward(),
        ]);
    }

    /**
     * Pays both sides into their wallets. Safe to call on every order — it
     * no-ops unless this is the referee's first qualifying order.
     */
    public function rewardOnFirstOrder(Order $order): void
    {
        $referral = Referral::where('referee_id', $order->user_id)
            ->where('status', 'PENDING')
            ->first();

        if (! $referral) {
            return;
        }

        DB::transaction(function () use ($referral, $order) {
            $this->creditWallet($referral->referrer_id, $referral->referrer_reward, "Referral reward — {$referral->code}");
            $this->creditWallet($referral->referee_id, $referral->referee_reward, 'Welcome referral bonus');

            $referral->update([
                'status' => 'REWARDED',
                'qualifying_order_id' => $order->id,
                'rewarded_at' => now(),
            ]);
        });
    }

    private function creditWallet(string $userId, float $amount, string $reason): void
    {
        if ($amount <= 0) {
            return;
        }

        $user = User::whereKey($userId)->lockForUpdate()->first();
        $balance = round($user->wallet_balance + $amount, 2);
        $user->forceFill(['wallet_balance' => $balance])->save();

        WalletTransaction::create([
            'user_id' => $user->id,
            'type' => 'CREDIT',
            'amount' => $amount,
            'balance_after' => $balance,
            'reason' => $reason,
        ]);
    }
}
