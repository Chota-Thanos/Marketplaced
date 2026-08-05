<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'status' => 'success',
            'data' => [
                'balance' => (float) $user->wallet_balance,
                'loyalty_points' => (int) $user->loyalty_points,
                'transactions' => $user->walletTransactions()->orderByDesc('created_at')->limit(100)->get(),
            ],
        ]);
    }

    /** Admin: manual credit/debit for exceptional cases (goodwill, corrections). */
    public function adjust(Request $request, $userId)
    {
        $validated = $request->validate([
            'type' => 'required|in:CREDIT,DEBIT',
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255',
        ]);

        $user = User::find($userId);

        if (! $user) {
            return response()->json(['status' => 'error', 'message' => 'User not found'], 404);
        }

        try {
            $transaction = self::apply(
                $user,
                $validated['type'],
                (float) $validated['amount'],
                $validated['reason'],
                'ADMIN_ADJUSTMENT',
                null,
            );
        } catch (\RuntimeException $e) {
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 422);
        }

        return response()->json(['status' => 'success', 'data' => $transaction]);
    }

    /**
     * Single place where wallet balance changes. Locks the user row so
     * concurrent credits/debits can't race and corrupt the running balance.
     */
    public static function apply(
        User $user,
        string $type,
        float $amount,
        string $reason,
        ?string $referenceType = null,
        ?string $referenceId = null,
    ): WalletTransaction {
        return DB::transaction(function () use ($user, $type, $amount, $reason, $referenceType, $referenceId) {
            $locked = User::where('id', $user->id)->lockForUpdate()->first();
            $balance = (float) $locked->wallet_balance;

            if ($type === 'DEBIT' && $balance < $amount) {
                throw new \RuntimeException('Insufficient wallet balance.');
            }

            $newBalance = $type === 'CREDIT' ? $balance + $amount : $balance - $amount;

            // Assigned directly rather than via update(): wallet_balance is
            // deliberately NOT mass-assignable, so no request payload can ever
            // set a user's balance — it only changes through this method.
            $locked->wallet_balance = $newBalance;
            $locked->save();

            return WalletTransaction::create([
                'user_id' => $locked->id,
                'type' => $type,
                'amount' => $amount,
                'balance_after' => $newBalance,
                'reason' => $reason,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
            ]);
        });
    }
}
