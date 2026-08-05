<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Models\WalletTransaction;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ── Users ────────────────────────────────────────────────────────
        $admin = User::create([
            'name' => 'BazaarX Admin',
            'email' => 'admin@bazaarx.com',
            'password' => Hash::make('BazaarX@2026!'),
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);

        $customer = User::create([
            'name' => 'Priya Sharma',
            'email' => 'priya.sharma@example.com',
            'phone' => '+919899911223',
            'password' => Hash::make('Password@123'),
            'role' => 'CUSTOMER',
            'status' => 'ACTIVE',
        ]);

        // ── Categories ───────────────────────────────────────────────────
        $categoriesData = [
            ['name' => 'Ethnic & Festive', 'slug' => 'ethnic-wear', 'icon_url' => 'Sparkles', 'sort_order' => 1, 'is_featured' => true],
            ['name' => 'Smart Tech & ANC', 'slug' => 'electronics', 'icon_url' => 'Headphones', 'sort_order' => 2, 'is_featured' => true],
            ['name' => 'Footwear & Sneakers', 'slug' => 'footwear', 'icon_url' => 'Zap', 'sort_order' => 3, 'is_featured' => false],
            ['name' => 'Handcrafted Decor', 'slug' => 'home-decor', 'icon_url' => 'Award', 'sort_order' => 4, 'is_featured' => false],
            ['name' => 'Ayurveda & Glow', 'slug' => 'wellness', 'icon_url' => 'Leaf', 'sort_order' => 5, 'is_featured' => false],
        ];

        $categories = [];
        foreach ($categoriesData as $data) {
            $categories[$data['slug']] = Category::create($data);
        }

        // ── Products + variants ─────────────────────────────────────────
        $productsData = [
            [
                'title' => 'Hand-Embroidered Chanderi Silk Anarkali Set',
                'slug' => 'chanderi-silk-anarkali-set',
                'category' => 'ethnic-wear',
                'brand' => 'BazaarX Heritage',
                'mrp' => 6999, 'price' => 3499,
                'is_new' => true,
                'description' => "Draped in the grandeur of India's GI-tagged Chanderi heritage, hand-embroidered by master weavers from Madhya Pradesh using genuine 24K-tested Zari threads.",
                'images' => [
                    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
                ],
                'tags' => ['GI Tagged', 'Pure Chanderi Silk', 'Handloom Zari'],
                'rollover_image' => 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'GI Heritage Certified',
                'local_store_available' => true,
                'local_store_name' => 'Bengaluru Indiranagar Store (In Stock)',
                'express_pincodes' => ['110001', '400001', '560001', '700001', '500001', '600001'],
                'hotspots' => [
                    ['id' => 'h1', 'top' => '28%', 'left' => '48%', 'title' => '24K Gold Zari Neckline', 'zoomRatio' => '4.5x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=400&q=80', 'detail' => 'Hand-embroidered 24K tested Zari threading crafted by GI-tagged master weavers in Chanderi.', 'techSpecs' => 'Thread Density: 120 TPI • Zari Grade: Premium Tested'],
                    ['id' => 'h2', 'top' => '55%', 'left' => '62%', 'title' => 'Pure Chanderi Silk Weave', 'zoomRatio' => '3.8x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80', 'detail' => 'Ultra-breathable natural silk warp & cotton weft producing a subtle translucent luster.', 'techSpecs' => 'Composition: 70% Pure Silk / 30% Cotton'],
                ],
                'variants' => [
                    ['size' => 'S', 'stock' => 3], ['size' => 'M', 'stock' => 4],
                    ['size' => 'L', 'stock' => 4], ['size' => 'XL', 'stock' => 2],
                    ['size' => 'Custom Tailored', 'stock' => 1],
                ],
            ],
            [
                'title' => 'ProBass Velocity ANC Wireless Headphones',
                'slug' => 'probass-velocity-anc-headphones',
                'category' => 'electronics',
                'brand' => 'ProBass',
                'mrp' => 4999, 'price' => 2299,
                'is_new' => false,
                'description' => 'Dual MEMS feedforward microphones actively eliminate up to 30dB of ambient noise. 40mm neodymium drivers, 40hr battery on Bluetooth 5.3.',
                'images' => ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
                'tags' => ['ANC 30dB Noise Cancel', '40hr Battery', 'Dual Mic Clear Call'],
                'rollover_image' => 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'HD Audio Certified',
                'local_store_available' => true,
                'local_store_name' => 'Delhi Connaught Place Store (In Stock)',
                'express_pincodes' => ['110001', '400001', '560001', '302001'],
                'hotspots' => [
                    ['id' => 'h1', 'top' => '32%', 'left' => '52%', 'title' => 'Dual Feedforward ANC Mics', 'zoomRatio' => '5.0x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80', 'detail' => 'Suppresses 30dB ambient background noise on flights and Indian railways.', 'techSpecs' => 'Noise Reduction: -30dB • Mic Tech: MEMS Dual Array'],
                    ['id' => 'h2', 'top' => '65%', 'left' => '32%', 'title' => 'Protein Leather Memory Foam', 'zoomRatio' => '4.0x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=400&q=80', 'detail' => 'Ergonomic breathable ear cushions designed for zero heat buildup during 12hr sessions.', 'techSpecs' => 'Foam Density: Ultra Memory • Outer: Vegan Protein Leather'],
                ],
                'variants' => [
                    ['color' => 'Matte Black', 'stock' => 3], ['color' => 'Cobalt Blue', 'stock' => 3],
                    ['color' => 'Silver Frost', 'stock' => 2],
                ],
            ],
            [
                'title' => 'AeroGlide Pro Stealth Carbon Running Shoes',
                'slug' => 'aeroglide-pro-carbon-running-shoes',
                'category' => 'footwear',
                'brand' => 'AeroGlide',
                'mrp' => 3999, 'price' => 1899,
                'is_new' => true,
                'description' => 'Engineered Jacquard 3D mesh upper with a full-length carbon fiber propulsive plate returning 85% kinetic energy on impact.',
                'images' => ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'],
                'tags' => ['Carbon Cushion Sole', 'Breathable Mesh', 'Orthopedic Fit'],
                'rollover_image' => 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'Ergonomic Performance Grade',
                'local_store_available' => true,
                'local_store_name' => 'Mumbai Bandra Store (In Stock)',
                'express_pincodes' => ['110001', '400001', '560001', '600001'],
                'hotspots' => [
                    ['id' => 'h1', 'top' => '42%', 'left' => '45%', 'title' => 'Breathable 3D Mesh Upper', 'zoomRatio' => '4.2x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80', 'detail' => 'Engineered Jacquard mesh with micro-ventilation zones for instant sweat dissipation.', 'techSpecs' => 'Mesh Type: Jacquard 3D • Airflow Rate: 42 CFM'],
                    ['id' => 'h2', 'top' => '78%', 'left' => '62%', 'title' => 'Carbon Plate EVA Sole', 'zoomRatio' => '4.8x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=400&q=80', 'detail' => 'Full-length carbon fiber propulsive plate returning 85% kinetic energy on impact.', 'techSpecs' => 'Plate Tech: Carbon Composite • Energy Return: 85%'],
                ],
                'variants' => [
                    ['size' => 'UK 7', 'stock' => 6], ['size' => 'UK 8', 'stock' => 6],
                    ['size' => 'UK 9', 'stock' => 6], ['size' => 'UK 10', 'stock' => 4],
                ],
            ],
            [
                'title' => 'Handcrafted Brass Dhokra Temple Bell Table Lamp',
                'slug' => 'dhokra-brass-table-lamp',
                'category' => 'home-decor',
                'brand' => 'BazaarX Artisan Collective',
                'mrp' => 5499, 'price' => 2799,
                'is_new' => false,
                'description' => 'Traditional lost-wax metal casting using beeswax molds, a technique passed down through 4000 years by Chhattisgarh tribal artisans.',
                'images' => ['https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80'],
                'tags' => ['Lost-Wax Cast', '100% Solid Brass', 'Fair Trade Artisan'],
                'rollover_image' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'GI Certified Tribal Craft',
                'local_store_available' => true,
                'local_store_name' => 'Kolkata Park Street Store (In Stock)',
                'express_pincodes' => ['110001', '400001', '560001'],
                'hotspots' => [
                    ['id' => 'h1', 'top' => '52%', 'left' => '50%', 'title' => 'Lost-Wax Brass Casting', 'zoomRatio' => '5.0x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=400&q=80', 'detail' => 'Traditional non-ferrous metal casting using beeswax molds passed down through 4000 years.', 'techSpecs' => 'Material: 100% Solid Brass • Technique: Cire Perdue'],
                ],
                'variants' => [
                    ['size' => 'Standard Lamp', 'stock' => 3], ['size' => 'Dimmer Edition', 'stock' => 2],
                ],
            ],
            [
                'title' => 'Kumkumadi Tailam Night Rejuvenating Facial Oil',
                'slug' => 'kumkumadi-tailam-facial-oil',
                'category' => 'wellness',
                'brand' => 'BazaarX Ayurveda',
                'mrp' => 1999, 'price' => 999,
                'is_new' => true,
                'description' => '100% Pure Grade-A Pampore saffron stigmas infused for 26 herbal days. AYUSH certified, paraben and mineral-oil free.',
                'images' => ['https://images.unsplash.com/photo-1608248597261-833258657b45?auto=format&fit=crop&w=800&q=80'],
                'tags' => ['100% Organic', 'Kashmiri Saffron', 'Paraben Free'],
                'rollover_image' => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'AYUSH Organic Certified',
                'local_store_available' => true,
                'local_store_name' => 'Hyderabad Jubilee Hills Store (In Stock)',
                'express_pincodes' => ['110001', '400001', '560001', '700001', '500001'],
                'hotspots' => [
                    ['id' => 'h1', 'top' => '48%', 'left' => '50%', 'title' => 'Kashmiri Mongra Saffron', 'zoomRatio' => '4.5x Macro', 'zoomedImage' => 'https://images.unsplash.com/photo-1608248597261-833258657b45?auto=format&fit=crop&w=400&q=80', 'detail' => '100% Pure Grade-A Pampore Saffron stigmas infused for 26 herbal days.', 'techSpecs' => 'Purity: 100% Certified Organic • Extracts: 26 Ayurvedic Herbs'],
                ],
                // Demonstrates real per-variant pricing — the size a customer
                // picks changes the price, which the old flat schema couldn't do.
                'variants' => [
                    ['size' => '15ml Trial', 'mrp' => 799, 'price' => 399, 'stock' => 20],
                    ['size' => '30ml Regular', 'mrp' => 1999, 'price' => 999, 'stock' => 18],
                    ['size' => '50ml Pack', 'mrp' => 2999, 'price' => 1599, 'stock' => 7],
                ],
            ],
        ];

        $products = [];
        foreach ($productsData as $data) {
            $categorySlug = $data['category'];
            $variants = $data['variants'];
            unset($data['category'], $data['variants']);

            $product = Product::create([
                ...$data,
                'category_id' => $categories[$categorySlug]->id,
                'status' => 'ACTIVE',
            ]);

            foreach ($variants as $i => $variant) {
                $product->variants()->create([
                    'sku' => strtoupper($product->slug).'-'.($i + 1),
                    ...$variant,
                ]);
            }

            $products[$product->slug] = $product;
        }

        // ── A delivered order for Priya, so the review purchase-gate has
        //    something real to check against ─────────────────────────────
        $anarkali = $products['chanderi-silk-anarkali-set'];
        $variant = $anarkali->variants()->first();

        $order = Order::create([
            'order_number' => 'ORD-'.strtoupper(Str::random(8)),
            'user_id' => $customer->id,
            'status' => 'DELIVERED',
            'payment_status' => 'PAID',
            'payment_method' => 'UPI',
            'transaction_id' => 'DEMO-TXN-001',
            'subtotal' => $anarkali->price,
            'discount' => 0,
            'shipping_charge' => 0,
            'total_amount' => $anarkali->price,
            'shipping_address' => [
                'name' => 'Priya Sharma', 'phone' => '+919899911223',
                'line1' => 'A-12, Green Park Colony', 'city' => 'New Delhi',
                'state' => 'Delhi', 'pincode' => '110016',
            ],
            'courier' => 'Delhivery Express',
            'tracking_no' => 'DEL-991234',
            'label_generated' => true,
        ]);

        $order->items()->create([
            'product_id' => $anarkali->id,
            'variant_id' => $variant->id,
            'quantity' => 1,
            'price' => $anarkali->price,
            'mrp' => $anarkali->mrp,
        ]);

        Review::create([
            'product_id' => $anarkali->id,
            'user_id' => $customer->id,
            'order_id' => $order->id,
            'rating' => 5,
            'title' => 'Absolutely stunning!',
            'body' => 'The zari work is exactly as shown. Shipped in 2 days via Delhivery.',
            'attribute_ratings' => ['quality' => 5, 'value' => 5, 'packaging' => 4, 'delivery' => 5],
            'status' => 'APPROVED',
            'verified_purchase' => true,
        ]);

        // ── Coupons ──────────────────────────────────────────────────────
        Coupon::create([
            'code' => 'BHARAT15',
            'description' => '15% off on UPI payments',
            'type' => 'PERCENT',
            'value' => 15,
            'min_order' => 999,
            'max_discount' => 750,
            'usage_limit' => 1000,
            'per_user_limit' => 3,
            'target_type' => 'ALL',
            'expires_at' => now()->addMonths(3),
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'FLAT200',
            'description' => 'Flat ₹200 off orders above ₹1,500',
            'type' => 'FLAT',
            'value' => 200,
            'min_order' => 1500,
            'usage_limit' => 500,
            'per_user_limit' => 1,
            'target_type' => 'ALL',
            'expires_at' => now()->addMonth(),
            'is_active' => true,
        ]);

        Coupon::create([
            'code' => 'FESTIVE500',
            'description' => '₹500 off ethnic wear',
            'type' => 'FLAT',
            'value' => 500,
            'min_order' => 2999,
            'target_type' => 'CATEGORY',
            'target_ids' => [$categories['ethnic-wear']->id],
            'expires_at' => now()->addMonths(2),
            'is_active' => true,
        ]);

        // Give the demo customer a small wallet balance + its ledger entry, so
        // the wallet UI has something real to show without a refund happening first.
        $customer->wallet_balance = 250;
        $customer->save();
        WalletTransaction::create([
            'user_id' => $customer->id,
            'type' => 'CREDIT',
            'amount' => 250,
            'balance_after' => 250,
            'reason' => 'Welcome bonus',
            'reference_type' => 'ADMIN_ADJUSTMENT',
        ]);
    }
}
