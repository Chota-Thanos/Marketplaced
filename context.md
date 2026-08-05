# MODERN MARKETPLACE — PRODUCT BLUEPRINT
**Project Type:** B2C Multi-Category Product Marketplace (Admin-managed inventory)
**Geography:** India (INR, Indian logistics integrations)
**Platforms:** Web + Mobile App (React Native)
**Status:** Planning Phase

---

## 1. PRODUCT VISION

A modern, admin-managed product marketplace for Indian consumers — selling physical and digital goods across all categories. The design premise: a buying experience that feels as good as it looks, with verified trust at every step and a discovery engine that actually works.

**Core differentiators over existing marketplaces:**
- Verified review system (purchase-gated, real-buyer only, with AI fraud detection)
- AI-powered smart discovery (intent-based search, not keyword-based)
- Real-time order transparency (GPS tracking, not just status strings)
- Post-purchase experience built in (returns, warranties, follow-ups)
- Visual-first, context-aware product pages
- Dark mode & accessibility-first design

---

## 2. USER ROLES

| Role | Description |
|------|-------------|
| **Customer** | Browses, wishlists, orders, reviews products |
| **Admin** | Full control — products, orders, inventory, pricing, analytics, promotions |
| **Super Admin** | Platform-level settings, admin management, reports |

> **Note:** No third-party sellers. Admin team controls all listings. This eliminates fake/duplicate listings and allows quality control.

---

## 3. PLATFORM ARCHITECTURE

### 3.1 Tech Stack (Recommended)

| Layer | Technology |
|---|---|
| Frontend (Web) | Next.js 14 (App Router) + TypeScript |
| Mobile App | React Native (Expo) |
| Backend / API | Node.js + Express OR NestJS |
| Database | PostgreSQL (primary) + Redis (caching/sessions) |
| File Storage | Cloudflare R2 or AWS S3 |
| Search Engine | Elasticsearch or Typesense |
| Payments | Razorpay (primary), PhonePe/UPI fallback |
| Notifications | Firebase (push), Twilio/MSG91 (SMS), NodeMailer (email) |
| Logistics APIs | Shiprocket / Delhivery / EasyEcom |
| AI/ML | OpenAI API or in-house model for search, recommendations, review analysis |
| Hosting | Vercel (web) + Railway/Render (backend) OR full AWS |

---

## 4. FEATURE MODULES

---

### MODULE A — CUSTOMER-FACING (Web + App)

---

#### A1. HOMEPAGE & DISCOVERY

**Components:**
- Hero banner with animated product showcases (auto-scroll, admin-editable)
- Category grid (icon-based, tap to browse)
- "Trending Now" — real-time popularity-based product row
- "New Arrivals" row
- "Deals of the Day" countdown timer section
- Personalised "Picked for You" row (based on browse/purchase history)
- Featured Collections / Curated Bundles
- Brand/Category spotlight banners (admin-managed)
- Recently Viewed (persistent across sessions)

**Requirements:**
- All sections admin-configurable from dashboard (order, visibility, content)
- Homepage loads under 2s (lazy-loading, image CDN)
- Skeleton loaders while content fetches
- Fully responsive + dark mode

---

#### A2. SEARCH & DISCOVERY ENGINE ⚡ (Key Differentiator)

**Standard features:**
- Full-text search with typo tolerance
- Search suggestions / autocomplete (as-you-type)
- Recent searches (stored locally)
- Popular searches section

**Modern differentiators:**
- **Semantic / Intent Search:** "something to gift my mom under ₹500" should return relevant results — powered by AI
- **Visual Search (Camera Search):** Upload a photo → find similar products (web + app)
- **Voice Search:** Especially for mobile app
- **Smart Filters:** Price range, rating, material, size, delivery speed, category — contextual (filters change based on category)
- **Search Analytics:** Admin can see what users search and find no results for → inventory gap alerts

**Requirements:**
- Elasticsearch or Typesense backend
- Real-time indexing when admin adds/edits products
- No-result fallback shows similar/related products

---

#### A3. CATEGORY & LISTING PAGES

- Hierarchical categories (e.g., Electronics → Phones → Smartphones)
- Breadcrumb navigation
- Sort by: Relevance, Price (asc/desc), Rating, Newest, Popularity
- Filter panel (sidebar on web, bottom sheet on mobile)
- Product cards: image, name, price, discount %, rating stars + count, quick-add-to-cart button
- "Low Stock" / "Best Seller" / "New" badge system
- Infinite scroll OR pagination (admin-configurable)
- Compare products (up to 3 side-by-side)

---

#### A4. PRODUCT DETAIL PAGE (PDP) ⚡ (Key Differentiator)

**Standard:**
- Multiple product images (zoomable, with video support)
- Title, price, MRP, discount %
- Variant selector (color/size/storage etc.)
- Stock availability indicator
- Add to Cart / Buy Now buttons
- Pincode-based delivery estimate (auto-detected on app)
- Return & warranty info

**Modern differentiators:**
- **360° / AR View:** "Try in Your Room" for furniture/decor, "Try On" for accessories (mobile app)
- **AI Product Summary:** Auto-generated honest bullet summary from all reviews ("Customers say: great battery, small screen")
- **Contextual specs table:** Specs appear based on category (phone shows network bands, furniture shows dimensions)
- **"Compare with similar" section** inline
- **Real buyer Q&A section:** Customers can ask questions, admin or other verified buyers answer
- **Authenticity badge:** Each product shows "Sold & fulfilled by [Platform Name]" with quality-check seal
- **Social proof bar:** "23 people viewing this right now" / "47 sold in last 24 hours"

---

#### A5. TRUST & REVIEWS SYSTEM ⚡ (Key Differentiator)

This is the biggest gap in existing marketplaces (fake reviews, incentivised reviews). Here's the solution:

**Purchase-gated reviews only:**
- Only customers who have received and confirmed delivery can leave a review
- Review window: 7–60 days post-delivery
- Review includes: star rating, text, up to 5 photos/videos

**Anti-fraud layer:**
- AI scans review text for patterns matching fake/incentivised reviews
- Flags reviews with generic praise, no specifics, or suspiciously fast submission
- Duplicate review detection across accounts
- "Verified Purchase" badge (mandatory, not optional like Amazon)

**Review quality:**
- Helpful/Not Helpful votes on reviews
- Reviews sorted by helpfulness by default
- "Most Critical Reviews" section (shows 1-2 star reviews prominently)
- Reviewer profile: join date, total reviews, verified buyer status

**Rating display:**
- Full histogram (not just average stars)
- Attribute ratings (Quality, Value for Money, Packaging, Delivery Speed)
- AI-generated summary at the top from all reviews

---

#### A6. CART & CHECKOUT

**Cart:**
- Persistent cart (synced across devices on login)
- Save for Later option
- Stock alert if item goes out of stock while in cart
- Price change alert (item in cart went up/down)
- Recommended add-ons/complementary products

**Checkout Flow (Single Page, Progressive):**
1. Delivery address (saved addresses + new + detect location)
2. Delivery speed selection (Standard / Express / Same-day if available)
3. Apply coupon / gift card
4. Order summary
5. Payment

**Payment options:**
- UPI (GPay, PhonePe, Paytm, BHIM)
- Cards (Credit/Debit, all major)
- Net Banking
- EMI options (for orders above ₹3,000)
- Pay on Delivery (COD, admin-configurable per pincode/product)
- Razorpay Wallet
- Buy Now Pay Later (via Simpl/LazyPay integration)

**Requirements:**
- Checkout completes in under 3 steps ideally
- Guest checkout allowed (account creation post-order)
- Address auto-fill via Google Places API
- OTP-less UPI intent on mobile app

---

#### A7. ORDER MANAGEMENT (Customer)

**My Orders page:**
- Order cards: product thumbnail, order ID, date, status, total
- Filter by status: All / Active / Delivered / Cancelled / Returned
- Search orders by product name or order ID

**Order Detail page:**
- Full item breakdown
- Real-time tracking map with courier partner integration (Shiprocket/Delhivery)
- Status timeline: Placed → Confirmed → Packed → Shipped → Out for Delivery → Delivered
- Live GPS tracking on "Out for Delivery" status (if courier API supports)
- One-tap cancel (before dispatch)
- Download invoice (PDF)
- Estimated delivery countdown

---

#### A8. RETURNS & REFUNDS ⚡ (Key Differentiator)

Existing marketplaces make returns painful. This platform makes it frictionless.

**Return flow:**
- "Return / Exchange" button available on delivered orders within return window
- Customer selects reason + uploads photo (optional but encouraged)
- System generates return pickup request automatically (via logistics API)
- Refund timeline displayed clearly: "₹XXX will be credited to your original payment method within 5–7 business days"

**Refund tracking:**
- Dedicated "Refund Status" tracker with steps
- Notification at each refund stage
- Option to choose: refund to source OR platform wallet (instant)

**Exchange:**
- Direct exchange flow (size/colour swap) with auto-reorder

---

#### A9. WISHLIST & COLLECTIONS

- Add to Wishlist from any product card or PDP
- Multiple wishlists ("Birthday List", "Office Stuff")
- Share wishlist via link (for gifting use case)
- Price drop alerts for wishlisted products
- Back-in-stock alerts for wishlisted OOS products

---

#### A10. NOTIFICATIONS CENTER

- In-app notification bell with unread count
- Push notifications (mobile) for: order updates, price drops, new arrivals in followed categories, deal alerts
- SMS for: order placed, OTP, shipment, delivery
- Email for: order confirmation, invoice, review request
- Notification preferences page (customer can opt out per type)

---

#### A11. CUSTOMER ACCOUNT

- Profile: name, phone, email, profile photo
- Saved Addresses (multiple, tag as Home/Work/Other)
- Saved Payment Methods (tokenised, Razorpay)
- Order history
- Wishlist
- Review history
- Wallet (refunds credited here, usable on next order)
- Referral program: "Invite & Earn ₹XX"
- Loyalty points (every ₹100 spent = X points, redeemable on next order)

---

#### A12. MOBILE APP EXCLUSIVE FEATURES

- Biometric login (Face ID / Fingerprint)
- Barcode scan to search product
- App-exclusive deals ("App-only Price")
- Haptic feedback on add-to-cart, order placed
- Offline wishlist access
- Swipe gestures for navigation
- Widget for order tracking (iOS/Android home screen)

---

### MODULE B — ADMIN DASHBOARD (Web only)

---

#### B1. DASHBOARD HOME (Overview)

- KPI cards: Today's Revenue, Orders, New Customers, Returns
- Revenue chart (daily/weekly/monthly toggle)
- Top selling products list
- Low-stock alerts
- Pending order actions count
- Recent orders feed (live)
- Search performance insights (top searches, zero-result searches)

---

#### B2. PRODUCT MANAGEMENT

- Add / Edit / Delete products
- Product form: title, description (rich text editor), category, tags, SKU, brand
- Pricing: MRP, selling price, cost price (private), discount %
- Variants manager: create variant groups (Color, Size, Storage) and SKU per variant
- Media upload: multiple images (drag-drop, reorder), video, 360° model
- SEO fields: meta title, description, URL slug
- Inventory: quantity, low-stock threshold, "Notify me when back" toggle
- Shipping settings per product: weight, dimensions, fragile flag, COD eligibility
- Product status: Draft / Active / Out of Stock / Discontinued
- Bulk upload via CSV/Excel
- Duplicate product
- Product preview (customer view)

---

#### B3. CATEGORY MANAGEMENT

- Create / edit / delete categories (nested hierarchy)
- Category icon/banner upload
- Set category-specific filters (admin defines what filters appear per category)
- Featured category toggle
- Sort order for homepage display

---

#### B4. ORDER MANAGEMENT

- Order list with filters: status, date range, payment method, amount range
- Order detail: full customer info, items, payment breakdown, address
- Manual status updates (if needed)
- Assign courier / generate label (via Shiprocket/Delhivery API)
- Print invoice / packing slip
- Handle cancellation requests
- Bulk actions: mark shipped, export to CSV

---

#### B5. INVENTORY MANAGEMENT

- Central inventory view across all products/variants
- Stock level indicators: In Stock / Low Stock / Out of Stock
- Low stock alert configuration (threshold per product)
- Stock adjustment (manual correction with reason log)
- Inventory history log
- Bulk stock update (CSV)

---

#### B6. PRICING & PROMOTIONS

- **Coupons:** Flat / percentage discount, minimum order, product/category-specific, usage limits, expiry
- **Flash Sales:** Time-limited deals with countdown, quantity limits
- **Bundle Deals:** "Buy 2, get 1 free" / "Buy X + Y for ₹ZZZ"
- **Loyalty Points Config:** Points earn rate, redemption rate, expiry policy
- **Referral Program Config:** Reward amounts for referrer and referee
- **Free Shipping Rules:** Threshold amount, pincode-specific

---

#### B7. REVIEW MODERATION

- Queue of pending reviews (AI pre-screened)
- Approve / Reject / Flag reviews
- AI fraud score per review (shown to admin)
- View customer's review history
- Reply to reviews (as "Brand Response")
- Q&A moderation (approve customer questions, answer them)

---

#### B8. CUSTOMER MANAGEMENT

- Customer list with search and filters
- Customer profile: order history, wallet balance, loyalty points, addresses, reviews
- Manual wallet credit/debit (for exceptional cases)
- Block/unblock customer
- Send manual notification to specific customer or segment

---

#### B9. RETURNS & REFUNDS MANAGEMENT

- Return requests queue with status
- Approve / Reject return with reason
- Trigger refund (to source or wallet)
- Pickup scheduling via logistics API
- Refund log with amounts and timeline

---

#### B10. ANALYTICS & REPORTS

- **Sales reports:** Revenue by day/week/month/product/category
- **Order reports:** Fulfillment rate, cancellation rate, return rate
- **Customer reports:** New vs returning, LTV (lifetime value), churn indicators
- **Inventory reports:** Fast movers, slow movers, dead stock
- **Search reports:** Top queries, zero-result queries, click-through from search
- **Review reports:** Average rating over time, sentiment trend
- Export all reports to CSV / PDF

---

#### B11. HOMEPAGE BUILDER

- Drag-drop section reordering
- Edit banner images and links
- Configure which product rows appear and which collections they pull from
- Toggle sections on/off
- Mobile vs web preview

---

#### B12. NOTIFICATIONS & COMMUNICATIONS

- Push notification broadcast (all users / by segment)
- Email campaign sender (promotional)
- SMS broadcast (via MSG91/Twilio)
- Transactional notification template editor (edit the text of order confirmation emails, etc.)

---

#### B13. SETTINGS

- Platform info: name, logo, favicon, contact details
- Delivery settings: COD on/off, free shipping threshold, serviceable pincodes
- Payment settings: gateway keys, enable/disable payment methods
- Return policy settings: return window (days), non-returnable category list
- Tax settings: GST rate per category
- SEO settings: site title, description, robots.txt
- Admin account management (create/manage sub-admins with role-based access)

---

## 5. DATABASE SCHEMA (Key Entities)

```
Users (customers)
  id, name, phone, email, password_hash, avatar, wallet_balance, loyalty_points, referral_code, status, created_at

Addresses
  id, user_id, tag, name, phone, line1, line2, city, state, pincode, is_default

Products
  id, title, slug, description, category_id, brand, tags[], status, created_at

Product_Variants
  id, product_id, sku, attributes{color, size...}, mrp, price, cost_price, stock, images[]

Categories
  id, name, slug, parent_id, icon_url, banner_url, filter_config{}, sort_order, is_featured

Orders
  id, user_id, status, payment_status, payment_method, subtotal, discount, shipping_charge, total, address_snapshot{}, created_at

Order_Items
  id, order_id, variant_id, quantity, price_at_purchase, mrp_at_purchase

Order_Tracking
  id, order_id, courier_partner, tracking_id, status_updates[]

Payments
  id, order_id, razorpay_order_id, razorpay_payment_id, method, amount, status, created_at

Reviews
  id, product_id, user_id, order_id, rating, title, body, media[], attribute_ratings{}, ai_fraud_score, status, created_at

Coupons
  id, code, type(flat/percent), value, min_order, max_discount, usage_limit, used_count, expiry, target_type, target_ids[], is_active

Wishlists
  id, user_id, name
Wishlist_Items
  id, wishlist_id, variant_id

Notifications
  id, user_id, type, title, body, data{}, is_read, created_at

Wallet_Transactions
  id, user_id, type(credit/debit), amount, reason, reference_id, created_at
```

---

## 6. UI / DESIGN LANGUAGE

### 6.1 Design Philosophy
**"Confident Minimalism"** — Every pixel earns its place. The interface recedes so products and content take centre stage. Bold type, generous whitespace, and micro-interactions that feel premium without being flashy.

### 6.2 Colour Palette
| Name | Hex | Usage |
|------|-----|-------|
| Ink Black | `#0D0D0D` | Primary text, nav background (dark mode primary) |
| Off White | `#F7F6F3` | Page background (light mode) |
| Signal Blue | `#1A56FF` | CTAs, links, interactive elements |
| Electric Lime | `#C8FF00` | Accent — badges, highlights, sale tags (used sparingly) |
| Warm Mid | `#7A7A72` | Secondary text, captions |
| Surface | `#FFFFFF` | Cards, sheets |
| Error Red | `#E53935` | Errors, destructive actions |
| Success Green | `#2E7D32` | Confirmations, in-stock |

### 6.3 Typography
| Role | Font | Weight |
|------|------|--------|
| Display (hero headlines) | **Clash Display** (Google Fonts) | 600–700 |
| Body | **Inter** | 400–500 |
| Data / Prices | **DM Mono** | 500 |

### 6.4 Signature Design Elements
- **Product cards** float on hover with a subtle lift shadow + the Electric Lime accent border appears
- **Cart drawer** slides in from right (not a redirect to cart page) — keeps context
- **"Add to Cart" button** has a fill-animation on click (pill fills left to right before transforming to "Added ✓")
- **Search bar** expands full-screen on focus with instant live suggestions
- **Bottom nav on mobile** uses icon + label, active state has a thin lime pill indicator
- **Order timeline** uses a vertical animated progress line

### 6.5 Dark Mode
Full dark mode support. Dark background: `#0D0D0D`, cards at `#161616`, borders at `#2A2A2A`. Accent colours remain the same.

---

## 7. NON-FUNCTIONAL REQUIREMENTS

| Requirement | Target |
|---|---|
| Page load (web) | < 2s on 4G |
| App startup time | < 1.5s |
| Search response | < 300ms |
| Payment success rate | > 98% |
| Uptime | 99.9% |
| Mobile app | iOS 14+ and Android 8+ |
| Web browser support | Chrome, Safari, Firefox, Edge (last 2 versions) |
| Accessibility | WCAG 2.1 AA compliant |
| Security | HTTPS, PCI-DSS compliant payments, JWT auth, OTP verification |

---

## 8. INTEGRATIONS

| Service | Purpose |
|---|---|
| **Razorpay** | Payments, EMI, UPI, payment links |
| **Shiprocket / Delhivery** | Logistics, order pickup, tracking |
| **Firebase** | Push notifications, auth (optional) |
| **MSG91 / Twilio** | SMS OTP, transactional SMS |
| **Google Places API** | Address autocomplete at checkout |
| **Cloudflare R2 / AWS S3** | Product image/video storage |
| **Elasticsearch / Typesense** | Search engine |
| **OpenAI API** | Intent search, review summarisation, fraud detection |

---

## 9. DEVELOPMENT PHASES

### Phase 1 — Core (MVP)
Product catalogue, categories, product detail page, cart, checkout (Razorpay), basic order management (customer + admin), admin product/order management, user auth.

### Phase 2 — Commerce Layer
Coupons/promotions, wishlist, reviews (basic, purchase-gated), returns & refunds flow, customer account, order tracking (status-based), notifications (email + SMS).

### Phase 3 — Intelligence Layer
AI-powered search (semantic), AI review summarisation,  personalised recommendations, loyalty points & referral system, search analytics for admin.

### Phase 4 — Experience Layer
Visual search (camera), AR product view (mobile), 360° product images, live order tracking, homepage builder, advanced analytics dashboard.

### Phase 5 — Scale & Polish
Performance optimisation, dark mode refinement, A/B testing infrastructure, PWA support, accessibility audit, internationalisation readiness.
