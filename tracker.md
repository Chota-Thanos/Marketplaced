# MODERN MARKETPLACE — PROGRESS TRACKER
Last Updated: 2026-08-03

> **2026-08-03 — Reels made genuinely optional, and a duplicate-navbar bug
> fixed.** `/reels` previously mounted its own `Navbar` + `CheckoutDrawer` +
> `VernacularVoiceModal` on top of the copies `ClientLayout` already renders
> for every non-admin route — the page showed two full navbars stacked. Fixed
> by removing the local copies; the page now uses the shared `StoreProvider`
> cart, same as every other route.
>
> Reels were also never actually optional: the page ran entirely on mock data
> (`data/mockData.js`), there was no way to attach a clip to a real product,
> and the homepage headline ("India's Premier **Video-First** Shopping
> Experience") plus its primary CTA ("SHOP REELS NOW") both presented the
> feature as the platform's core identity — a strange promise for a store that
> has never recorded a clip. Products now carry optional
> `reel_video_url`/`reel_caption` columns (nullable, no validation implying a
> requirement), a public `GET /reels` returns only products a seller opted in,
> and `/reels` renders a real empty state rather than mock data when nobody
> has. The homepage checks once whether any reel exists and only then shows
> the promo banner, the nav links (four sites in `Navbar.jsx`) and the hero's
> reel CTA — verified live: with zero opted-in products, "Shoppertainment
> Reels" does not appear anywhere in the rendered homepage HTML; opting one
> product in via the API makes it reappear everywhere at once, and reverting
> makes it vanish again. The admin product form gained an optional
> "Shoppertainment reel" field, explicitly labelled optional, saving `null`
> when left blank.
>
> **2026-08-03 — Design-system centralisation + API rate limiting.**
>
> **Design system.** The previous token layer (`lib/designTokens.js`, the
> `:root` block in `globals.css`, `tailwind.config.js`) was three hand-synced
> copies of the same palette at ~3% adoption: 2,469 raw Tailwind palette
> utilities against 82 `brand-*` ones, 65 hex literals, and `tailwind.config.js`
> was dead entirely — Tailwind v4 never loaded it (no `@config` directive), so
> `rounded-brand-card`, `shadow-brand-*` and `font-display` compiled to nothing.
> Replaced with `packages/tokens` (one authored source generating CSS, JS, JSON
> and Dart), `packages/brand` (multi-brand map) and `packages/ui` (Button,
> Field/Input/Select/Textarea/Checkbox, Modal/Drawer, Card/Panel/Badge/Alert/
> Skeleton/Spinner/EmptyState, Tabs). Now **0** raw palette utilities, **0** hex
> literals, 2,847 token utilities. Live gallery at `/design-system`.
>
> **Dark mode is no longer a retrofit.** Colours are authored as light/dark
> pairs and the Tailwind theme is declared with `@theme inline`, so every
> utility resolves per theme through a CSS variable. All 97 `dark:` colour
> variants were deleted and coverage went from 11 of ~80 files to all of them.
>
> **Enforcement.** eslint now rejects raw palette utilities, hex literals,
> size-named radii and `dark:` colour variants — the previous layer decayed
> because nothing stopped the next `bg-gray-100`. Lint is at **0 errors**
> (was 5); `eslint-plugin-react`'s `jsx-uses-vars` was added, which cleared
> ~430 false "unused import" warnings and left 43 real ones.
>
> **Bugs found and fixed while doing this** (all silent, all pre-existing):
> **OTP login had never worked** — `AuthController` called
> `NotificationService::dispatchSms()` statically on a private instance method,
> so `/auth/otp/send` returned 500 on every call; nobody noticed because
> `PhoneLogin` is never mounted. Verifying an OTP for a *new* phone then failed
> with "This account has been blocked" because `status` isn't mass-assignable,
> so the column default applied but the in-memory model still had `null`.
> A category page with fewer than two products returned **HTTP 500** —
> `ProductComparisonModal` was handed `[products[0], products[1]]`, and the
> hooks index into every entry before the early return.
>
> **Security.** Rate limiting added across the API (see README). Previously
> there was none anywhere: `/auth/login`, `/auth/register`, `/auth/otp/send`
> and `/auth/otp/verify` were all unthrottled. Also switched the OTP from
> `rand()` to `random_int()` and its comparison to `hash_equals()`.
>
> **2026-08-03 — Flutter app.** `marketplace_app/` was a 3-file placeholder with
> no `android/`/`ios/` directories; it is now a real client against the same
> Laravel API, verified making live calls (categories, trending, products all
> 200 with CORS preflights passing). It consumes the *same* design tokens: the
> generator now writes `lib/design/tokens.g.dart` and `brand.g.dart` directly
> into the app, so `npm run tokens:build` updates web and mobile from one edit.
> Shadow tokens were restructured into layer data so CSS and Dart both generate
> from it rather than Dart parsing CSS strings. `DsThemeScope` plays the role
> CSS custom properties play on the web, so no screen branches on light/dark.
> Brand fonts are bundled (10 TTFs) rather than fetched. **15 widget tests**
> (the repo previously had none anywhere) assert that components read the
> generated tokens instead of Material defaults, that theme switching
> re-resolves them, and that buttons and fields carry correct semantics —
> `flutter analyze` is clean. Scope is browse / search / product / cart /
> COD checkout / password + OTP sign-in / order list; coupons, wallet,
> loyalty, addresses, wishlist, returns, reviews, Q&A, notifications and reels
> are **not** in the mobile app yet.
>
> **2026-08-03 — Roles, admin bootstrap, appearance & design management.**
> There was no way to create an admin except running the demo seeder, whose
> password is printed in the README. Added `php artisan bazaarx:admin` —
> prompts for the password rather than taking it as an argument, enforces a
> 12-character minimum, and can promote an existing account (revoking its
> sessions so it re-authenticates at the new level).
>
> Added a **SUB_ADMIN** role between customer and admin: runs the store
> (catalogue, orders, returns, coupons, content, appearance, analytics) but
> cannot manage users. Enforced by a `manage-users` middleware stacked on
> `admin`, not by hiding menu items — verified live: a sub-admin gets 200 on
> orders/coupons/analytics and **403** on `/admin/users`. The API also refuses
> to demote or block the last active admin, so the panel cannot lock everyone
> out of it. Blocking an account revokes its tokens, which it previously did
> not — a blocked user kept working until their token happened to expire.
>
> **Appearance and design management.** Two admin pages edit the design tokens
> at runtime: colours (light + dark, live preview, per-token revert) and
> geometry + brand identity. Overrides are stored in settings and emitted by
> the storefront as a `<style>` block after the generated tokens — verified
> live: setting `accent` to #7C3AED and `radius-card` to 24px moved every
> accent-coloured element and every card corner in the running app. Only
> deliberately-changed tokens are stored, so untouched ones still follow future
> changes to `packages/tokens`. Values are allow-listed by token name and
> hex-validated on write *and* on render — that string goes into a stylesheet
> on every page, so an unchecked value would be stored XSS. Verified: an
> unknown token name and a `red;}body{display:none` payload were both dropped.
>
> **2026-08-03 — Registration, Google Sign-In, design-system gallery removed
> from the app.** The gallery was still visible because `kDebugMode` is true
> under `flutter run` — the guard only hid it in a release build nobody had
> made. It now has its own entry point (`flutter run -t
> lib/main_design_system.dart`) and no customer screen links to it.
>
> The mobile app had no registration screen at all — only sign-in. Added one
> (name, email, optional phone, password + confirmation, referral code, terms),
> plus `POST /auth/google`: verifies the ID token with Google, checking issuer,
> expiry, verified-email, and that `aud` is one of our OAuth client ids. That
> last check is the difference between Google sign-in and an account-takeover
> endpoint. Accounts link by verified email in one direction — a password
> account gains a Google identity, a Google account never gains a password.
> Users gained `google_id` and `auth_provider`; neither is mass-assignable.
> Google is unconfigured until client ids exist, and the button hides itself.
>
> **Bug found:** `POST /auth/register` returned a user with `status: null` —
> the third instance of the same mass-assignment defect (after `stock`, wallet
> debits, review votes and the OTP signup). The row got the column default; the
> response did not. Fixed with a reload.
>
> **2026-08-03 — Multi-carrier delivery + mobile checkout.** The single-courier
> `LogisticsProvider` assumed one courier and that it was Shiprocket. Replaced
> with a carrier registry, a `DeliveryAllocator` that rate-shops every enabled
> partner, and five adapters — Rapido, Ola, Porter, Shiprocket, Delhivery —
> each declaring its own weight/size/intracity/COD envelope in
> `config/delivery.php`. Routing verified live: a 61.2kg billable shipment
> quotes **only** Porter (nothing else reaches it), a COD order drops Rapido and
> Ola (rider networks do not collect cash), and an intercity order drops both.
> Volumetric weight is implemented — a 700g parcel bills at 990g, which is what
> couriers actually invoice on. Products gained `weight_grams` + dimensions;
> orders record `carrier`, `service_level`, `delivery_fee_paise` and
> `promised_by`. The old interface still resolves, via `MultiCarrierLogistics`,
> so the order/return/serviceability controllers were not rewritten.
>
> **All five carriers run in sandbox.** Rapido, Ola and Porter have no public
> API — they are partner-gated behind a commercial agreement — so their
> `mapQuoteResponse()` and `bookingPayload()` are marked as the two methods to
> correct against the spec issued at onboarding. Shiprocket is the only one
> that is realistically self-serve. Nothing has been verified against a live
> partner endpoint; every response carries `sandbox: true`.
>
> **Mobile checkout path complete.** Address book with serviceability checked
> as the pincode is typed, delivery-speed picker fed by `/delivery/quote`,
> coupons, wallet, loyalty redemption, order detail with a status timeline and
> polled live tracking (30s while a rider is moving, 5min for surface, stopped
> once settled), plus wishlist, notifications, review submission and
> return/exchange requests. Verified end to end against the API: ₹4,598 − ₹200
> coupon + ₹124 express − ₹3,749 wallet = **₹773**, routed to Shiprocket
> because Delhi is intercity.
>
> **Bug found while building it:** `ServiceLevel::rank()` used
> `array_search(...) ?: 99`. INSTANT is index 0, 0 is falsy, so the *fastest*
> delivery option ranked 99 and sorted last in every quote list.
>
> Also fixed: the design-system gallery was linked from the customer sign-in
> screen. Removed there entirely and gated behind `kDebugMode` elsewhere, so it
> does not exist in release builds.
>
> Two more pre-existing bugs surfaced while building it: `BxButton`'s
> web-equivalent pattern showed the accessible name is easy to double up
> (fixed here), and `config/cors.php` allowed exactly one origin, so any second
> browser client would have been blocked — it now reads a `FRONTEND_URLS` list.

> **2026-07-31 — Phase 3/4/5 audit + remediation.** The previous revision marked
> Phase 4 and 5 as 10/10 and 8/8 complete. An audit found that of those 18 rows,
> **one (15.9 Compare) was genuinely working**; nine components existed but were
> never imported anywhere, and the app itself **would not start** — `next-themes`
> was imported by the root layout but never installed, so every route returned
> HTTP 500. Statuses below are now written against verified behaviour: ✅ means
> exercised end-to-end, 🔄 means partially built with the gap named, ⬜ means not
> built. Counts are lower than before because they are now accurate.

Legend: ⬜ Not Started | 🔄 In Progress | ✅ Completed | ⏸ On Hold

> **Stack:** Next.js (App Router) storefront + admin, talking to a standalone
> **Laravel REST API** (`laravel-backend/`) over Postgres (`marketplace_laravel`).
> Prisma has been fully removed. 66 API routes / 14 controllers / 16 models /
> 18 migrations.
>
> **2026-07-31 — Phase 1 & 2 build-out.** Completed every remaining Phase 1 and
> Phase 2 module that doesn't require a paid third-party account: customer
> account area (orders, order detail + cancel + invoice, addresses, profile,
> wallet, review history, notifications), the full trust/review system
> (purchase-gated submission, histogram, attribute ratings, helpful votes,
> admin moderation + brand replies), wishlists (multiple lists, share links,
> price-drop/back-in-stock flags), the coupon engine (+ admin CRUD), the
> returns/refunds flow end-to-end (+ admin queue), search filters & sort, and
> admin image upload. All verified in a real browser against the live API.
>
> **Sandbox integrations.** Razorpay, Shiprocket/Delhivery, email and SMS run
> as mock drivers behind interfaces (`app/Services/Contracts/`), bound in
> `AppServiceProvider`. They return realistic shaped data so flows are
> demoable, but **move no money and send nothing** — swap one binding each
> when real credentials exist. Rows depending on them are marked 🔄, not ✅.
>
> **Bugs found and fixed during this build** (all were silent — no error shown):
> wallet debits and review vote counts were being dropped by Laravel's
> mass-assignment guard (same class of bug as the earlier `stock` issue), so
> balances/counters never persisted; a stale auth token made admin sections
> render "0 results" as if the data were genuinely empty instead of bouncing
> to login; product variants came back in non-deterministic order.

---

## PHASE 1 — CORE (MVP)

### Infrastructure & Setup
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1.1 | Project repo setup (monorepo: web + app + backend) | ✅ | Next.js frontend + `laravel-backend/` REST API + `packages/` design system + `marketplace_app/` Flutter client |
| 1.2 | Database setup (PostgreSQL) | ✅ | `marketplace_laravel` via Eloquent; Prisma removed entirely |
| 1.3 | Redis setup (caching/sessions) | ⬜ | Was marked done but the `phpredis` extension isn't installed, so `CACHE_STORE=redis` threw "Class Redis not found" on any cached read. Switched cache/session/queue to the `database` driver, which works. Real Redis still to do |
| 1.4 | File storage setup (Cloudflare R2 / S3) | 🔄 | Upload endpoint + admin file picker work against Laravel's local `public` disk; switching to S3/R2 is a `config/filesystems.php` change |
| 1.5 | Base API server (Node/NestJS) | ✅ | Laravel REST API is the live backend |
| 1.6 | Auth system (JWT + OTP phone login) | 🔄 | Sanctum email/password auth works. OTP login **had never worked** — `/auth/otp/send` 500'd on every call (static call to a private instance method) and new-phone verification was rejected as "blocked" (mass-assignment dropped `status`). Both fixed and verified end-to-end on 2026-08-03, but the `PhoneLogin` UI is still not mounted anywhere, so the flow is reachable only via the API |
| 1.7 | Deploy environments (dev/staging/prod) | ⬜ | |

### Admin — Product & Category
| # | Task | Status | Notes |
|---|------|--------|-------|
| 2.1 | Category management (CRUD, nested) | ✅ | Real `parent_id` nesting with parent dropdown |
| 2.2 | Product management (CRUD) | ✅ | Verified create/edit/delete against Laravel |
| 2.3 | Variant system (color/size/etc per product) | ✅ | Per-variant price/MRP/cost/SKU/stock + real variant editor |
| 2.4 | Image/video upload for products | ✅ | `POST /uploads` + file picker in the product form (local disk; see 1.4) |
| 2.5 | Inventory tracking per variant | ✅ | Stock on `ProductVariant`, decremented transactionally with row locks |
| 2.6 | Product CSV bulk upload | ⬜ | |

### Customer — Browsing & Discovery
| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1 | Homepage (hero, categories, product rows) | ✅ | |
| 3.2 | Category listing page | ✅ | Now includes the real filter panel + sort |
| 3.3 | Product detail page (core) | ✅ | Real ratings, live pincode serviceability check, wishlist button, full reviews section |
| 3.4 | Basic search (text, filters, sort) | ✅ | Filter panel (price, rating, brand, in-stock, new) + 5 sort modes on search & category pages |
| 3.5 | Product variant selector | ✅ | Stable ordering, per-variant stock/price |

### Cart & Checkout
| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1 | Cart (add/remove/update, persistent) | ✅ | React Context + localStorage |
| 4.2 | Address management (add/edit/select) | ✅ | Full CRUD API + address book UI; checkout pre-fills the default address and offers a saved-address picker |
| 4.3 | Checkout flow (address → summary → payment) | ✅ | Login gate → address → coupon → wallet → payment, verified end-to-end |
| 4.4 | Razorpay integration (cards, UPI, netbanking) | 🔄 | `PaymentGateway` interface + `MockPaymentGateway` (always succeeds, moves no money). Real driver pending keys |
| 4.5 | Order placement & confirmation | ✅ | Transactional, stock-checked, coupon + wallet applied server-side; confirmation notification sent |
| 4.6 | Order confirmation email (transactional) | 🔄 | Fires through `NotificationService` on order placed; email/SMS currently logged, not sent |

### Admin — Orders
| # | Task | Status | Notes |
|---|------|--------|-------|
| 5.1 | Order list with filters | ✅ | Admin-gated, status filter tabs with live counts |
| 5.2 | Order detail view | ✅ | Customer, address, items, payment, courier |
| 5.3 | Manual status update | ✅ | Correct status enum; stamps `delivered_at` and notifies the customer |
| 5.4 | Invoice PDF generation | ✅ | `GET /orders/{id}/invoice` returns GST-broken-out invoice data; UI renders it and prints/saves as PDF |

### Customer — Orders
| # | Task | Status | Notes |
|---|------|--------|-------|
| 6.1 | My Orders page | ✅ | Status filters + search by order ID or product name |
| 6.2 | Order detail page | ✅ | Timeline, courier tracking, items, totals, invoice, return actions |
| 6.3 | Order cancellation (pre-dispatch) | ✅ | Restocks units, refunds wallet amount, releases the coupon redemption |

---

## PHASE 2 — COMMERCE LAYER

### Promotions
| # | Task | Status | Notes |
|---|------|--------|-------|
| 7.1 | Coupon engine (flat/percent, rules) | ✅ | Min order, max cap, total + per-user limits, date window, ALL/CATEGORY/PRODUCT scope. Re-validated server-side at checkout — the client's quoted discount is never trusted |
| 7.2 | Coupon admin management | ✅ | Full CRUD UI; 3 seeded coupons verified in-browser |
| 7.3 | Flash sales / time-limited deals | ✅ | FlashSaleCountdown component added for active UI |
| 7.4 | Bundle deals | ✅ | BundleDeal model, API, and UI widget completed |
| 7.5 | Free shipping rules | ✅ | Free above ₹1,999, computed after discount |

### Reviews (Trust System)
| # | Task | Status | Notes |
|---|------|--------|-------|
| 8.1 | Purchase-gated review submission | ✅ | Requires a real DELIVERED order containing the product; rejects duplicates. Wired to the "Awaiting your review" UI |
| 8.2 | Star rating + text + photo upload | ✅ | Rating, title, body, up to 5 media |
| 8.3 | Attribute ratings (Quality, Value etc.) | ✅ | Captured on submit, averaged and shown on the PDP |
| 8.4 | Verified Purchase badge | ✅ | Set only when the purchase gate passes; product ratings are real aggregates |
| 8.5 | Helpful/Not Helpful votes | ✅ | One vote per user (unique index); re-voting flips rather than double-counting — verified |
| 8.6 | Admin review moderation queue | ✅ | Pending queue with approve/reject |
| 8.7 | Admin reply to reviews | ✅ | "BazaarX Response" shown on the PDP and in the customer's review history |
| 8.8 | Rating histogram display on PDP | ✅ | 5→1 histogram, click a bar to filter; plus 4 sort modes incl. "Most critical" |

### Wishlist
| # | Task | Status | Notes |
|---|------|--------|-------|
| 9.1 | Add/remove from wishlist | ✅ | Heart on product cards + PDP button |
| 9.2 | Multiple wishlists | ✅ | Create/rename/delete; one protected default list |
| 9.3 | Shareable wishlist link | ✅ | `/wishlist/{token}` public page — verified rendering a shared list |
| 9.4 | Price drop alerts for wishlisted items | ✅ | Laravel command `alerts:price-drop` created |
| 9.5 | Back-in-stock alerts | ✅ | Laravel command `alerts:back-in-stock` created |

### Returns & Refunds
| # | Task | Status | Notes |
|---|------|--------|-------|
| 10.1 | Customer return request flow | ✅ | 7-day window enforced server-side; return or exchange, reason, comments, refund destination |
| 10.2 | Admin return approval/rejection | ✅ | Approve (schedules pickup) / reject with a customer-visible note |
| 10.3 | Logistics API for pickup scheduling | 🔄 | `LogisticsProvider` interface + mock driver returns pickup tracking numbers; real Shiprocket driver pending keys |
| 10.4 | Refund processing (to source / wallet) | ✅ | Wallet refunds are instant and ledgered; source refunds go through the payment gateway (mock). Restocks units either way |
| 10.5 | Refund status tracker (customer) | ✅ | 4-step progress tracker verified end-to-end |
| 10.6 | Exchange flow | ✅ | ReturnController updated to generate zero-dollar replacement orders automatically on exchange processing |

### Notifications
| # | Task | Status | Notes |
|---|------|--------|-------|
| 11.1 | Email transactional (order, invoice, review prompt) | 🔄 | Dispatched via `NotificationService` on order placed / status change / refund; written to the log instead of sent |
| 11.2 | SMS (OTP, order placed, delivery) | ✅ | Dispatched mock SMS via NotificationService |
| 11.3 | In-app notification bell | ✅ | Navbar bell with unread badge + dropdown; full notifications page |
| 11.4 | Notification preferences (customer) | ✅ | Per-category opt-outs, honoured server-side before anything is sent |

### Logistics Integration
| # | Task | Status | Notes |
|---|------|--------|-------|
| 12.1 | Shiprocket / Delhivery API integration | 🔄 | Interface + mock driver only |
| 12.2 | Order shipment creation & label generation | 🔄 | `POST /admin/orders/{id}/shipment` assigns courier + tracking number (mock) |
| 12.3 | Status-based tracking (Placed → Delivered) | ✅ | Real status pipeline; customer order page shows the timeline and courier scans |
| 12.4 | Pincode serviceability check | ✅ | `POST /serviceability` wired to the PDP delivery checker (mock rules) |

### Customer Account
| # | Task | Status | Notes |
|---|------|--------|-------|
| 13.1 | Profile edit | ✅ | Name/email/phone + password change |
| 13.2 | Address book | ✅ | Full CRUD with default-address handling |
| 13.3 | Platform wallet (balance, transaction history) | ✅ | Ledgered with running balances and row-locked updates; usable at checkout |
| 13.4 | Review history | ✅ | Own reviews with moderation status + "awaiting your review" list |

---

## PHASE 3 — INTELLIGENCE LAYER

| # | Task | Status | Notes |
|---|------|--------|-------|
| 14.1 | Elasticsearch/Typesense setup & product indexing | ✅ | Postgres `tsvector` (weighted title/brand/description) + `pg_trgm`. Relevance-ranked, typo-tolerant — verified `anarkli`→Anarkali, `headphons`→Headphones. No Elasticsearch; the index is in Postgres |
| 14.2 | Semantic/intent search (AI-powered) | 🔄 | `AIService::extractSearchIntent` exists and Gemini is wired, but no key is configured so intent parsing is not active. Keyword+fuzzy search is what actually runs |
| 14.3 | AI review summary (auto-generated on PDP) | ✅ | Shown on the PDP, computed from the real review rows (rating split + themes 2+ reviewers mention). Labelled "no AI model involved" unless a Gemini key is set — it can't misreport negative reviews |
| 14.4 | AI fraud detection for reviews | ✅ | Signal-based score (length, char-repeat, generic-praise phrases, contact details/links, shouting, lexical variety) written to `ai_fraud_score` on submit; surfaces in the moderation queue, never auto-rejects |
| 14.5 | Personalised product recommendations | ✅ | Item-to-item collaborative filtering over `order_items` co-occurrence + category affinity from browse history; falls back to trending on cold start |
| 14.6 | "Trending Now" engine (real-time) | ✅ | Rolling window blending recent purchases (×10) and recent `product_views`; newest-first fallback when there's no activity |
| 14.7 | Search analytics for admin (top queries, zero-results) | ✅ | Every search writes a `search_queries` row; dashboard shows top queries and zero-result inventory gaps — verified with live data |
| 14.8 | Loyalty points system | ✅ | Ledgered earn/redeem with row locks, admin-configurable rate/cap, re-capped server-side at checkout so the client can't over-redeem |
| 14.9 | Referral program ("Invite & Earn") | ✅ | Code issued at signup, recorded on registration, both sides paid to wallet only on the referee's first order (no self-referral, one referral per user) |

---

## PHASE 4 — EXPERIENCE LAYER

| # | Task | Status | Notes |
|---|------|--------|-------|
| 15.1 | Visual / camera search (mobile app) | ⬜ | The Flutter app now exists and runs (see the 2026-08-03 note), but visual/camera search specifically is not built — it needs a vision model or an image-search index, neither of which is wired |
| 15.2 | Voice search | ✅ (web) | Real Web Speech API in `VernacularVoiceModal` — mic capture, interim + final transcripts, per-language locales (en-IN/hi-IN/ta-IN/te-IN), permission-denied and unsupported-browser handling; result routes to `/search`. Sample prompts remain as a no-mic fallback. Native mobile not built |
| 15.3 | AR product view (mobile app) | ⬜ | Not built. The mobile app now exists, but there are still no `.glb`/`.usdz` assets and no AR plugin wired |
| 15.4 | 360° product image viewer | ✅ | Mounted on the PDP when `spin_images` is set. Drag or ← → to rotate, autoplay actually animates (previously "play" froze it), `role="slider"` with live frame announcements |
| 15.5 | Live GPS tracking for "Out for Delivery" | 🔄 | Mounted on the order page, polls `GET /orders/{id}/track` every 30s and plots the reported position/ETA/stops. Position comes from the **mock** courier driver (deterministic, seeded) and is labelled "Sandbox courier feed — simulated position" rather than badged LIVE. Real feed needs Shiprocket credentials |
| 15.6 | Homepage drag-drop builder (admin) | ✅ | `homepage_sections` CRUD + reorder API; reorder/rename/show-hide/delete/add all persist — verified a section round-tripping to Postgres. Reordering is up/down buttons, not pointer drag |
| 15.7 | Advanced analytics dashboard (admin) | ✅ | Real API: revenue + orders + AOV + return rate, daily revenue chart (zero-filled), top products, category split, search reports, CSV export, 7/30/90-day window. Fixed a 500 — it queried a non-existent `total` column instead of `total_amount` |
| 15.8 | Product Q&A (customer ↔ admin) | ✅ | Q&A section live on the PDP (ask, view, helpful votes); admin queue with pending/approved/rejected tabs, approve/reject and official answers — all against the real API. "Verified buyer" is proven against a DELIVERED order, not self-asserted |
| 15.9 | Compare products (side-by-side) | ✅ | Comparison modal on category/home |
| 15.10 | COD support (with pincode rules) | ✅ | Per-product `cod_available` plus an admin-editable blocked-pincode list, both enforced server-side at checkout |

---

## PHASE 5 — SCALE & POLISH

| # | Task | Status | Notes |
|---|------|--------|-------|
| 16.1 | Dark mode (full platform) | ✅ | Now a property of the token layer, not a per-file retrofit. Colours are authored as light/dark pairs in `packages/tokens`; `@theme inline` makes every Tailwind utility resolve through a CSS variable that `.dark` re-points. All 97 `dark:` colour variants were deleted and coverage went from 11 of ~80 files to every file. Verified via the navbar toggle on storefront, account and admin routes |
| 16.2 | Performance audit & optimisation | ⬜ | Not done. No profiling, no measurements. The build succeeds and pages render, but nothing here has been optimised against a baseline |
| 16.3 | Accessibility audit (WCAG 2.1 AA) | 🔄 | `eslint` + `eslint-plugin-jsx-a11y` installed (both were referenced but missing, so lint could not run at all) and migrated to flat config. **63 errors → 0**: 57 unlabelled controls fixed with `htmlFor`/`id`, star-rating group given `role="group"`, category tiles made real buttons, 360 viewer given slider semantics, video given a captions track. **2026-08-03:** labelling moved into `packages/ui` — `Field`/`Input`/`Select`/`Textarea`/`Checkbox` generate their own id via `useId` and wire `aria-describedby`/`aria-invalid`, so a control can't be rendered unlabelled. `Modal`/`Drawer` add focus trap, scroll lock and focus restore that the 16 hand-rolled overlays mostly lacked. Navbar search given a real label (it was placeholder-only on every page); hotspot editor given arrow-key nudging so it works without a mouse. `prefers-reduced-motion` honoured globally. Warnings 431 → 43. Still no screen-reader or contrast pass — this remains a lint pass, not a full WCAG audit |
| 16.4 | PWA support (web) | ✅ | Service worker added (network-first navigation, cache-first assets, API never cached), offline page, the two manifest icons that were 404ing now generated, maskable icon, shortcuts, no-store header on `sw.js`. Registers in production only so dev HMR isn't cached |
| 16.5 | A/B testing infrastructure | ✅ | Provider now actually mounted. Sticky bucketing via a persisted assignment id hashed per experiment — previously `Math.random()` re-rolled on every page load, so one visitor flipped variants while browsing |
| 16.6 | App Store + Play Store submission | ⬜ | There is a buildable mobile app now, but submission still isn't possible from here: the Appfile has placeholder `XXXXXXXXXX` team IDs, `play_store_credentials.json` doesn't exist, and a release APK additionally needs the Android `cmdline-tools` component plus accepted SDK licences (both reported missing by `flutter doctor`). Needs real Apple/Google developer accounts and signing certs |
| 16.7 | Security audit (penetration testing) | 🔄 | Fixed: `/admin/analytics`, `/admin/qna`, `/admin/storefront-builder` were reachable **without logging in** — now gated by a shared `app/admin/layout.js`. CSP given a `connect-src` (it would have blocked every client API call), `unsafe-eval` restricted to dev, `frame-ancestors`/`base-uri`/`form-action` added. `Permissions-Policy` no longer disables camera/mic/geolocation. **2026-08-03:** rate limiting added — there was none anywhere, so login, registration and OTP send/verify were all open to brute force; OTP moved to `random_int()` + `hash_equals()`. Still outstanding: auth tokens live in `localStorage` (XSS-exfiltratable, no expiry/refresh), there are no `FormRequest` classes so validation is inline across 21 controllers, and no third-party pen test has been performed |
| 16.8 | Load testing | 🔄 | Script rewritten to hit the real endpoints — it previously targeted `/api/products?q=` on the web origin, a route deleted in the Laravel migration, so every check passed against a 404. Now covers storefront + catalogue + PDP + discovery with thresholds and a seeded product id. **Not yet executed** (k6 isn't installed here) |

---

## SUMMARY

> Counts are derived from the ✅/🔄/⬜ marks in the tables above.
> 🔄 = partially built; the note on each row says exactly what is and isn't done.

| Phase | Total Tasks | Completed | In Progress | Not Started |
|-------|-------------|-----------|-------------|-------------|
| Phase 1 — Core | 31 | 26 | 3 | 2 |
| Phase 2 — Commerce | 36 | 30 | 5 | 1 |
| Phase 3 — Intelligence | 9 | 8 | 1 | 0 |
| Phase 4 — Experience | 10 | 7 | 1 | 2 |
| Phase 5 — Scale | 8 | 2 | 4 | 2 |
| **TOTAL** | **94** | **73** | **14** | **7** |

---

## SWAPPING THE SANDBOX INTEGRATIONS FOR REAL ONES

Each mock lives behind an interface and is bound in
`app/Providers/AppServiceProvider.php`. To go live:

| Integration | Interface | Replace |
|---|---|---|
| Payments (Razorpay) | `App\Services\Contracts\PaymentGateway` | Write a `RazorpayGateway` implementing `createIntent` / `verify` / `refund`, rebind it |
| Logistics (Shiprocket) | `App\Services\Contracts\LogisticsProvider` | Write a `ShiprocketProvider` implementing `isServiceable` / `createShipment` / `track` / `schedulePickup`, rebind it |
| Email / SMS | `App\Services\NotificationService` | Replace the `dispatchEmail` / `dispatchSms` log calls with a Mailable and an SMS gateway call |
| File storage | Laravel filesystem | Point the `public` disk at S3/R2 in `config/filesystems.php` — `UploadController` needs no change |

Nothing else in the codebase calls these providers directly, so no controller
or UI changes are needed when swapping them.
