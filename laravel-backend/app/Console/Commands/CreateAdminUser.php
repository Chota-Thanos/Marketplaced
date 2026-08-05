<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

/**
 * Creates an admin (or sub-admin) account from the command line.
 *
 * This is how a fresh deployment gets its first way in. The alternative —
 * running the demo seeder — creates a known email and a password that is in the
 * README, which is fine for a demo and unacceptable for anyone's live store.
 *
 *     php artisan bazaarx:admin
 *     php artisan bazaarx:admin --email=ops@shop.in --name="Ops" --role=SUB_ADMIN
 *
 * The password is prompted for and never passed as an argument, so it does not
 * land in shell history or in the process list.
 */
class CreateAdminUser extends Command
{
    protected $signature = 'bazaarx:admin
        {--email= : Email address to sign in with}
        {--name= : Display name}
        {--phone= : Optional mobile number}
        {--role=ADMIN : ADMIN (full) or SUB_ADMIN (everything except user management)}
        {--promote : Promote an existing account instead of creating one}';

    protected $description = 'Create an admin or sub-admin account, or promote an existing user';

    public function handle(ReferralService $referrals): int
    {
        $role = strtoupper((string) $this->option('role'));

        if (! in_array($role, [User::ROLE_ADMIN, User::ROLE_SUB_ADMIN], true)) {
            $this->error("Role must be ADMIN or SUB_ADMIN, got '{$role}'.");

            return self::FAILURE;
        }

        $email = $this->option('email') ?: $this->ask('Email address');
        $email = strtolower(trim((string) $email));

        $existing = User::whereRaw('LOWER(email) = ?', [$email])->first();

        if ($existing) {
            return $this->promote($existing, $role);
        }

        if ($this->option('promote')) {
            $this->error("No account found for {$email}. Drop --promote to create one.");

            return self::FAILURE;
        }

        return $this->create($email, $role, $referrals);
    }

    private function promote(User $user, string $role): int
    {
        $this->warn("An account already exists for {$user->email} (currently {$user->role}).");

        if (! $this->confirm("Promote it to {$role}?", true)) {
            $this->line('Nothing changed.');

            return self::SUCCESS;
        }

        // role and status are not mass-assignable, deliberately — they decide
        // who gets in, so nothing sets them from request data.
        $user->forceFill(['role' => $role, 'status' => 'ACTIVE'])->save();

        // Elevating privileges must not leave old sessions running at the old
        // level, and a previously-blocked account must not keep working on a
        // token issued before the block.
        $user->tokens()->delete();

        $this->info("{$user->email} is now {$role}. Existing sessions were revoked — sign in again.");

        return self::SUCCESS;
    }

    private function create(string $email, string $role, ReferralService $referrals): int
    {
        $name = $this->option('name') ?: $this->ask('Display name');
        $phone = $this->option('phone') ?: null;

        $password = $this->secret('Password (min 12 characters)');
        $confirm = $this->secret('Confirm password');

        if ($password !== $confirm) {
            $this->error('Those passwords do not match.');

            return self::FAILURE;
        }

        $validator = Validator::make(
            ['email' => $email, 'name' => $name, 'phone' => $phone, 'password' => $password],
            [
                'email' => 'required|email|unique:users,email',
                'name' => 'required|string|max:255',
                'phone' => 'nullable|string|unique:users,phone',
                // Longer than the customer minimum on purpose: this account can
                // read every order and every address in the system.
                'password' => 'required|string|min:12',
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'password' => Hash::make($password),
        ]);

        $user->forceFill([
            'role' => $role,
            'status' => 'ACTIVE',
            'email_verified_at' => now(),
        ])->save();

        $referrals->ensureCode($user);

        $this->newLine();
        $this->info("Created {$role} account for {$email}.");
        $this->line('Sign in at /admin.');

        if ($role === User::ROLE_SUB_ADMIN) {
            $this->line('Sub-admins can do everything except manage users.');
        }

        return self::SUCCESS;
    }
}
