# BazaarX Marketplace

Next.js storefront + admin panel, backed by a standalone **Laravel REST API**
over PostgreSQL.

```
.
├── app/, components/, lib/   Next.js frontend (storefront + admin)
├── packages/                 Design system — tokens, brand, UI primitives
└── laravel-backend/          Laravel REST API (the backend)
```

`packages/` is the shared design layer: one authored token source that
generates CSS, JS and Dart, a brand map keyed by brand id, and the React
primitives every screen is built from. See [packages/README.md](packages/README.md),
and `/design-system` in the running app for the live component gallery.

---

## Running it

You need **two** processes: the Laravel API on `:8000` and Next.js on `:3000`.
The frontend reads the API URL from `NEXT_PUBLIC_API_URL` in `.env`.

### Easiest — both at once

```bash
npm run dev:all
```

### Or run them in two terminals

Terminal 1 — backend:

```bash
npm run backend
```

Terminal 2 — frontend:

```bash
npm run dev
```

Then open http://localhost:3000

> **`php` must be on your PATH.** The simplest way on this machine is to open
> **Laragon → Terminal**, which puts Laragon's PHP on the PATH automatically,
> and run the commands there. If you use a different terminal and get
> `php: command not found`, either add
> `C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64` to your PATH, or run the
> backend directly:
>
> ```bash
> cd laravel-backend && "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" artisan serve --port=8000
> ```

---

## Database

PostgreSQL must be running. Connection settings live in `laravel-backend/.env`
(`marketplace_laravel` database, `postgres`/`postgres` by default).

```bash
npm run backend:migrate   # apply new migrations
npm run backend:reset     # DROP everything, re-migrate, re-seed (destructive)
```

`backend:reset` wipes all data and reseeds demo products, categories, coupons
and users. It also invalidates any existing login tokens, so you'll be asked
to sign in again.

---

## Creating an admin account

The demo accounts below exist only because the seeder creates them. **On a real
install, do not run the seeder** — its passwords are in this file. Create the
first admin from the command line instead:

```bash
cd laravel-backend && php artisan bazaarx:admin
```

It prompts for email, name and a password (minimum 12 characters — this account
can read every order and address in the system). The password is prompted for,
never passed as an argument, so it does not end up in shell history.

Non-interactively, or to promote an existing customer:

```bash
php artisan bazaarx:admin --email=ops@yourshop.in --name="Ops" --role=SUB_ADMIN
php artisan bazaarx:admin --email=someone@yourshop.in --promote
```

Promoting revokes the account's existing sessions, so it has to sign in again at
the new level.

### Roles

| Role | Can do |
|---|---|
| `CUSTOMER` | Shop. |
| `SUB_ADMIN` | Run the store: catalogue, categories, orders, returns, reviews, Q&A, coupons, broadcasts, storefront content, colours, design, analytics. |
| `ADMIN` | All of the above **plus** user management — creating and demoting staff, blocking accounts, resetting staff passwords, adjusting wallets. |

Sub-admins are created by an admin from **Admin → Users & staff**, or with
`--role=SUB_ADMIN` above. The distinction is enforced by middleware
(`manage-users` stacked on `admin`), not by hiding menu items — a sub-admin who
types `/admin/users` gets a 403 from the API and an explanation.

The API refuses to demote or block the last active admin, so there is no way to
lock yourself out of user management from inside the panel.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bazaarx.com` | `BazaarX@2026!` |
| Customer | `priya.sharma@example.com` | `Password@123` |

Admin panel is at `/admin`, customer account area at `/account/orders`.

---

## Sandbox integrations

Payments, logistics, email and SMS run as **mock drivers** — they return
realistic data so the flows are demoable, but they move no money and send
nothing. Each sits behind an interface bound in
`laravel-backend/app/Providers/AppServiceProvider.php`:

| Integration | Interface |
|---|---|
| Payments (Razorpay) | `App\Services\Contracts\PaymentGateway` |
| Logistics (Shiprocket) | `App\Services\Contracts\LogisticsProvider` |
| AI (search, summaries, fraud) | `App\Services\Contracts\AiProvider` |
| Email / SMS | `App\Services\NotificationService` |

Swapping one in means writing a class that implements the interface and
changing a single binding — no controller or UI changes needed.

---

## Rate limiting

Credential and OTP endpoints carry per-identity **and** per-IP limiters, defined
in `AppServiceProvider::registerRateLimiters()` and applied in `routes/api.php`:

| Endpoint | Limit |
|---|---|
| `POST /auth/login` | 5/min per email+IP, 30/hr per IP |
| `POST /auth/register` | 10/hr per IP |
| `POST /auth/otp/send` | 3 per 5 min per phone, 20/hr per IP |
| `POST /auth/otp/verify` | 5 per 5 min per phone, 30/hr per IP |
| everything under `/v1` | 120/min per user or IP |
| costly writes (checkout, uploads, reviews, Q&A, votes) | 20/min |

The OTP is six digits with a five-minute life and no attempt counter of its own,
so the `otp-verify` throttle is the only thing between an attacker and a sweep
of the code space. Don't remove it without adding one.

See `tracker.md` for feature-by-feature status.

---

## Delivery partners

Fulfilment is multi-carrier. `DeliveryAllocator` rate-shops every enabled
partner per shipment and returns one option per speed; the customer picks a
speed, not a courier.

| Carrier | Envelope | Service levels |
|---|---|---|
| Rapido | ≤15kg, ≤45cm, intracity, no COD | Instant, same-day |
| Ola | ≤20kg, ≤50cm, intracity, no COD | Instant, same-day |
| Porter | ≤750kg, ≤300cm, intracity, COD | Instant, same-day, heavy |
| Shiprocket | ≤50kg, ≤120cm, anywhere, COD | Express, standard |
| Delhivery | ≤50kg, ≤120cm, anywhere, COD | Express, standard |

Limits live in `config/delivery.php`, so the allocator shortlists without a
network call per partner, and turning a carrier on or off is an env change
(`DELIVERY_CARRIERS`).

**All five run in sandbox until credentials exist.** Rapido, Ola and Porter have
no public API — access is granted through a commercial agreement and merchant
onboarding, after which you receive credentials and their integration docs.
Shiprocket is the only one that is realistically self-serve. In each adapter,
`mapQuoteResponse()` and `bookingPayload()` are marked as the only two methods
that need correcting against the real spec; nothing else in the codebase talks
to a partner directly. Every sandbox response carries `sandbox: true`, and
`GET /admin/delivery/carriers` reports each partner's mode.

Billing uses **volumetric weight** — the greater of actual and
`(L × W × H) / 5000` — because that is what couriers invoice on. Under-quoting
it is the standard way margin leaks to post-delivery weight-discrepancy charges.

---

## Google Sign-In

`POST /auth/google` takes a Google ID token, verifies it with Google, and issues
a Sanctum token. It is a single endpoint for sign-in *and* sign-up — the server
decides which, so the client never has to ask.

Verification (`app/Services/GoogleIdentityService.php`) checks the issuer, the
expiry, that the email is verified, and — most importantly — that `aud` is one
of **our** OAuth client ids. Without that last check, an ID token from any other
app using Google Sign-In would buy a session here for whatever email it carries.

Set the client ids in `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`,
`GOOGLE_IOS_CLIENT_ID`); until at least one is present the endpoint refuses
every request and the mobile button hides itself. See
[marketplace_app/README.md](marketplace_app/README.md) for the console setup.

Users gain `google_id` (Google's `sub`, the only safe join key — email is not,
because Workspace addresses get reassigned) and `auth_provider`. Neither is
mass-assignable.

---

## Appearance & design management

Two admin pages let a store owner re-skin the product without a deploy:

- **Admin → Colours** (`/admin/appearance`) — every semantic colour token, light
  and dark, with a live preview and per-token revert.
- **Admin → Design** (`/admin/design`) — corner radii (named by role, not size)
  and brand identity: name, logo text, tagline, support email, legal entity.

They edit **design tokens**, not page styles. Changing `accent` moves every
`bg-accent`, `text-accent` and `ring-accent` across the storefront, the admin
panel and the mobile app at once, because all of them resolve through the one
CSS variable. That is the whole return on the token layer.

Only tokens that are deliberately changed are stored. Anything untouched keeps
following the shipped default, so a future palette change in
`packages/tokens` still reaches it — storing a full snapshot would freeze the
design system at whatever it looked like the day someone first opened the page.

The storefront fetches the overrides server-side and emits them as a `<style>`
block after the generated tokens, so there is no flash of the default palette.
Values are allow-listed by token name and matched against a strict hex pattern
before they are stored **and** again before they are rendered — that string is
interpolated into a stylesheet on every page, so an unchecked value would be
stored XSS.

Both pages are reachable by sub-admins: appearance is store operations, not
access control.
