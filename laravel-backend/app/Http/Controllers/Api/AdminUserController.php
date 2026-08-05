<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * User and staff management. Full admins only — the routes carry
 * `manage-users` on top of `admin`.
 *
 * Everything here is deliberately narrow: an admin can change someone's role,
 * block them, or reset a staff password. There is no "edit any user's details"
 * endpoint, because support staff editing a customer's email is an account
 * takeover with extra steps.
 */
class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'role' => ['nullable', Rule::in([...User::STAFF_ROLES, User::ROLE_CUSTOMER])],
            'status' => 'nullable|in:ACTIVE,BLOCKED',
            'q' => 'nullable|string|max:120',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = User::query()
            ->select(['id', 'name', 'email', 'phone', 'role', 'status', 'avatar',
                'wallet_balance', 'loyalty_points', 'auth_provider', 'created_at'])
            ->withCount('orders')
            ->orderByRaw("CASE role WHEN 'SUPER_ADMIN' THEN 0 WHEN 'ADMIN' THEN 1 WHEN 'SUB_ADMIN' THEN 2 ELSE 3 END")
            ->orderByDesc('created_at');

        if (! empty($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        if (! empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (! empty($validated['q'])) {
            $term = '%'.strtolower($validated['q']).'%';
            $query->where(fn ($q) => $q
                ->whereRaw('LOWER(name) LIKE ?', [$term])
                ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                ->orWhere('phone', 'like', $term));
        }

        $users = $query->paginate($validated['per_page'] ?? 25);

        return response()->json([
            'status' => 'success',
            'data' => $users->items(),
            'meta' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'counts' => [
                    'customers' => User::where('role', User::ROLE_CUSTOMER)->count(),
                    'sub_admins' => User::where('role', User::ROLE_SUB_ADMIN)->count(),
                    'admins' => User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])->count(),
                    'blocked' => User::where('status', 'BLOCKED')->count(),
                ],
            ],
        ]);
    }

    /**
     * Create a staff account directly, with a password the admin hands over.
     *
     * No email invite flow, because there is no configured mailer yet — an
     * invite that silently goes to a log file is worse than no invite. Swap
     * this for a tokened invite once NotificationService sends real mail.
     */
    public function storeStaff(Request $request, ReferralService $referrals)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|unique:users,phone',
            'password' => 'required|string|min:12',
            'role' => ['required', Rule::in([User::ROLE_SUB_ADMIN, User::ROLE_ADMIN])],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
        ]);

        // role and status are not mass-assignable — set explicitly, or the row
        // takes the column default and comes back as a blocked customer.
        $user->forceFill([
            'role' => $validated['role'],
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
        ])->save();

        $referrals->ensureCode($user);

        return response()->json([
            'status' => 'success',
            'message' => "{$user->name} can now sign in to the admin panel.",
            'data' => $user->fresh(),
        ], 201);
    }

    public function updateRole(Request $request, string $id)
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in([User::ROLE_CUSTOMER, User::ROLE_SUB_ADMIN, User::ROLE_ADMIN])],
        ]);

        $user = User::findOrFail($id);
        $actor = $request->user();

        // An admin demoting themselves can lock the whole organisation out of
        // user management if they are the last one.
        if ($user->id === $actor->id) {
            throw ValidationException::withMessages([
                'role' => ['You cannot change your own role. Ask another admin.'],
            ]);
        }

        $this->guardLastAdmin($user, $validated['role']);

        $user->forceFill(['role' => $validated['role']])->save();

        return response()->json([
            'status' => 'success',
            'message' => "{$user->name} is now a ".$this->roleLabel($validated['role']).'.',
            'data' => $user->fresh(),
        ]);
    }

    public function updateStatus(Request $request, string $id)
    {
        $validated = $request->validate(['status' => 'required|in:ACTIVE,BLOCKED']);

        $user = User::findOrFail($id);
        $actor = $request->user();

        if ($user->id === $actor->id) {
            throw ValidationException::withMessages([
                'status' => ['You cannot block your own account.'],
            ]);
        }

        if ($validated['status'] === 'BLOCKED') {
            $this->guardLastAdmin($user, User::ROLE_CUSTOMER);
        }

        $user->forceFill(['status' => $validated['status']])->save();

        // Blocking has to invalidate live sessions, or the account keeps working
        // until its token happens to expire.
        if ($validated['status'] === 'BLOCKED') {
            $user->tokens()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => $validated['status'] === 'BLOCKED'
                ? "{$user->name} is blocked and has been signed out everywhere."
                : "{$user->name} can sign in again.",
            'data' => $user->fresh(),
        ]);
    }

    /** Reset a staff password. Customers use the normal reset flow. */
    public function resetStaffPassword(Request $request, string $id)
    {
        $validated = $request->validate(['password' => 'required|string|min:12']);

        $user = User::findOrFail($id);

        if (! $user->isAdmin()) {
            throw ValidationException::withMessages([
                'password' => ['Only staff passwords can be reset here.'],
            ]);
        }

        $user->forceFill(['password' => Hash::make($validated['password'])])->save();
        $user->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => "{$user->name}'s password was reset and their sessions were revoked.",
        ]);
    }

    /**
     * Refuses a change that would leave nobody able to manage users.
     *
     * Without this, one careless demotion means editing the database by hand to
     * get back in — the exact situation the artisan command exists to avoid,
     * arrived at from the other direction.
     */
    private function guardLastAdmin(User $user, string $newRole): void
    {
        if (! $user->canManageUsers()) {
            return;
        }

        $stillAdmin = in_array($newRole, [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN], true);
        if ($stillAdmin) {
            return;
        }

        $remaining = User::whereIn('role', [User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN])
            ->where('status', 'ACTIVE')
            ->where('id', '!=', $user->id)
            ->count();

        if ($remaining === 0) {
            throw ValidationException::withMessages([
                'role' => ['This is the last active admin. Promote someone else first.'],
            ]);
        }
    }

    private function roleLabel(string $role): string
    {
        return match ($role) {
            User::ROLE_ADMIN, User::ROLE_SUPER_ADMIN => 'full admin',
            User::ROLE_SUB_ADMIN => 'sub-admin',
            default => 'customer',
        };
    }
}
