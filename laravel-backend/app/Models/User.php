<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

// google_id, auth_provider and status stay OUT of this list on purpose:
// they decide who you are and whether you're allowed in, so they are set
// explicitly with forceFill rather than being settable from a request body.
#[Fillable(['name', 'email', 'phone', 'password', 'role', 'avatar', 'notification_preferences'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasApiTokens, HasUuids, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'wallet_balance' => 'decimal:2',
            'notification_preferences' => 'array',
        ];
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    public function walletTransactions()
    {
        return $this->hasMany(WalletTransaction::class);
    }

    public function notifications()
    {
        return $this->hasMany(AppNotification::class);
    }

    public function returnRequests()
    {
        return $this->hasMany(ReturnRequest::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Roles
    |--------------------------------------------------------------------------
    |
    | CUSTOMER   — shops.
    | SUB_ADMIN  — runs the store: catalogue, orders, returns, coupons, content,
    |              appearance, analytics. Everything except deciding who else
    |              gets in and what they can do.
    | ADMIN      — the above plus user management: creating and demoting
    |              sub-admins, blocking accounts, adjusting wallets.
    |
    | SUPER_ADMIN predates this and is treated as ADMIN so existing accounts
    | keep working.
    */
    public const ROLE_CUSTOMER = 'CUSTOMER';
    public const ROLE_SUB_ADMIN = 'SUB_ADMIN';
    public const ROLE_ADMIN = 'ADMIN';
    public const ROLE_SUPER_ADMIN = 'SUPER_ADMIN';

    public const STAFF_ROLES = [self::ROLE_SUB_ADMIN, self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN];

    /** Can reach the admin panel at all. */
    public function isAdmin(): bool
    {
        return in_array($this->role, self::STAFF_ROLES, true);
    }

    /**
     * Can manage other people's accounts and permissions.
     *
     * Kept as its own question rather than folded into isAdmin(): the whole
     * point of the sub-admin role is that "can use the admin panel" and "can
     * grant admin access" are different privileges. Conflating them is how a
     * junior operations hire ends up able to promote themselves.
     */
    public function canManageUsers(): bool
    {
        return in_array($this->role, [self::ROLE_ADMIN, self::ROLE_SUPER_ADMIN], true);
    }

    public function isSubAdmin(): bool
    {
        return $this->role === self::ROLE_SUB_ADMIN;
    }

    /** Every customer gets one default wishlist, created lazily on first use. */
    public function defaultWishlist(): Wishlist
    {
        return $this->wishlists()->firstOrCreate(
            ['is_default' => true],
            ['name' => 'My Wishlist']
        );
    }

    public function wantsNotification(string $type): bool
    {
        $prefs = $this->notification_preferences ?? [];

        return $prefs[$type] ?? true;
    }
}
