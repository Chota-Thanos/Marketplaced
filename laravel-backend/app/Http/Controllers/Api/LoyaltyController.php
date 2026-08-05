<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoyaltyTransaction;
use App\Models\Referral;
use App\Services\LoyaltyService;
use App\Services\ReferralService;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(
        private LoyaltyService $loyalty,
        private ReferralService $referrals,
    ) {}

    /** Balance, conversion rules and ledger for the account area. */
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'points' => $user->loyalty_points,
                'value' => $this->loyalty->pointsToRupees($user->loyalty_points),
                'earn_per_100' => $this->loyalty->earnRate(),
                'redeem_value' => $this->loyalty->redeemValue(),
                'max_redeem_percent' => $this->loyalty->maxRedeemPercent(),
                'transactions' => LoyaltyTransaction::where('user_id', $user->id)
                    ->orderByDesc('created_at')->limit(50)->get(),
            ],
        ]);
    }

    /** How many points this user may apply to a given cart value. */
    public function quote(Request $request)
    {
        $validated = $request->validate(['order_total' => 'required|numeric|min:0']);
        $user = $request->user();

        $maxPoints = $this->loyalty->maxRedeemablePoints($user, (float) $validated['order_total']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'points' => $user->loyalty_points,
                'max_redeemable_points' => $maxPoints,
                'max_discount' => $this->loyalty->pointsToRupees($maxPoints),
            ],
        ]);
    }

    /** Referral code, rewards and invite history. */
    public function referrals(Request $request)
    {
        $user = $request->user();
        $code = $this->referrals->ensureCode($user);

        $invites = Referral::where('referrer_id', $user->id)
            ->with('referee:id,name,created_at')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->referee?->name ?? 'Invited user',
                'status' => $r->status,
                'reward' => (float) $r->referrer_reward,
                'joined_at' => $r->created_at,
                'rewarded_at' => $r->rewarded_at,
            ]);

        return response()->json([
            'status' => 'success',
            'data' => [
                'code' => $code,
                'referrer_reward' => $this->referrals->referrerReward(),
                'referee_reward' => $this->referrals->refereeReward(),
                'total_earned' => (float) Referral::where('referrer_id', $user->id)
                    ->where('status', 'REWARDED')->sum('referrer_reward'),
                'pending_count' => Referral::where('referrer_id', $user->id)->where('status', 'PENDING')->count(),
                'invites' => $invites,
            ],
        ]);
    }
}
