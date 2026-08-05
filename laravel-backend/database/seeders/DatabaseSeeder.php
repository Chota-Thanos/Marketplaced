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
        $admin1 = User::updateOrCreate(
            ['email' => 'admin@bazaarx.com'],
            [
                'name' => 'BazaarX Admin',
                'password' => Hash::make('BazaarX@2026!'),
                'role' => 'ADMIN',
                'status' => 'ACTIVE',
            ]
        );

        $admin2 = User::updateOrCreate(
            ['email' => 'admin@rentalmoney.in'],
            [
                'name' => 'Store Admin',
                'password' => Hash::make('AdminPassword123!'),
                'role' => 'ADMIN',
                'status' => 'ACTIVE',
            ]
        );

        $customer = User::updateOrCreate(
            ['email' => 'priya.sharma@example.com'],
            [
                'name' => 'Priya Sharma',
                'phone' => '+919899911223',
                'password' => Hash::make('Password@123'),
                'role' => 'CUSTOMER',
                'status' => 'ACTIVE',
            ]
        );

        // ── Categories ───────────────────────────────────────────────────
        $categoriesData = [
            ['name' => 'Ethnic & Festive', 'slug' => 'ethnic-wear', 'icon_url' => 'Sparkles', 'sort_order' => 1, 'is_featured' => true],
            ['name' => 'Casual & Streetwear', 'slug' => 'casual-wear', 'icon_url' => 'Shirt', 'sort_order' => 2, 'is_featured' => true],
            ['name' => 'Footwear & Sneakers', 'slug' => 'footwear', 'icon_url' => 'Zap', 'sort_order' => 3, 'is_featured' => true],
            ['name' => 'Smart Tech & ANC', 'slug' => 'electronics', 'icon_url' => 'Headphones', 'sort_order' => 4, 'is_featured' => false],
            ['name' => 'Ayurveda & Glow', 'slug' => 'wellness', 'icon_url' => 'Leaf', 'sort_order' => 5, 'is_featured' => false],
        ];

        $categories = [];
        foreach ($categoriesData as $data) {
            $categories[$data['slug']] = Category::updateOrCreate(['slug' => $data['slug']], $data);
        }

        // ── Products + variants ─────────────────────────────────────────
        $productsData = [
            // --- CLOTHING 1: Ethnic ---
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
                ],
                'variants' => [
                    ['size' => 'S', 'stock' => 3], ['size' => 'M', 'stock' => 5],
                    ['size' => 'L', 'stock' => 4], ['size' => 'XL', 'stock' => 2],
                ],
            ],
            // --- CLOTHING 2: Festive Sherwani ---
            [
                'title' => 'Royal Velvet Embroidered Sherwani & Stole',
                'slug' => 'royal-velvet-sherwani-set',
                'category' => 'ethnic-wear',
                'brand' => 'Royal Couture',
                'mrp' => 12999, 'price' => 7499,
                'is_new' => true,
                'description' => 'Crafted in micro-velvet with intricate Dori embroidery and metallic tilla highlights. Comes complete with churidar pyjama and silk embroidered stole.',
                'images' => [
                    'https://images.unsplash.com/photo-1597983073493-88cd35cf03b0?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
                ],
                'tags' => ['Wedding Edition', 'Royal Velvet', 'Hand Crafted'],
                'rollover_image' => 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'Designer Edition',
                'local_store_available' => true,
                'local_store_name' => 'Delhi South Extension Store (In Stock)',
                'express_pincodes' => ['110001', '400001', '560001'],
                'hotspots' => [],
                'variants' => [
                    ['size' => '38 (M)', 'stock' => 2], ['size' => '40 (L)', 'stock' => 4],
                    ['size' => '42 (XL)', 'stock' => 3],
                ],
            ],
            // --- CLOTHING 3: Casual Streetwear Denim Jacket ---
            [
                'title' => 'Vintage Heavyweight Indigo Denim Jacket',
                'slug' => 'vintage-heavyweight-denim-jacket',
                'category' => 'casual-wear',
                'brand' => 'Urban Thread Co.',
                'mrp' => 4500, 'price' => 2299,
                'is_new' => false,
                'description' => '14.5oz selvedge cotton denim with stone-wash finish. Reinforced double-stitched seams and antique brass button closures.',
                'images' => [
                    'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
                ],
                'tags' => ['100% Cotton Denim', 'Relaxed Fit', 'Heavyweight 14.5oz'],
                'rollover_image' => 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'Streetwear Certified',
                'local_store_available' => true,
                'local_store_name' => 'Mumbai Bandra Store (In Stock)',
                'express_pincodes' => ['400001', '560001'],
                'hotspots' => [],
                'variants' => [
                    ['size' => 'M', 'stock' => 6], ['size' => 'L', 'stock' => 8], ['size' => 'XL', 'stock' => 4],
                ],
            ],
            // --- CLOTHING 4: Linen Shirt ---
            [
                'title' => 'Pure French Linen Casual Shirt - Olive Green',
                'slug' => 'pure-french-linen-casual-shirt',
                'category' => 'casual-wear',
                'brand' => 'Urban Thread Co.',
                'mrp' => 3299, 'price' => 1699,
                'is_new' => true,
                'description' => 'Woven from 100% natural Normandy flax fibers. Ultra-breathable, garment-dyed for a soft, relaxed texture ideal for warm climates.',
                'images' => [
                    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
                ],
                'tags' => ['100% Linen', 'Breathable Summer', 'Regular Fit'],
                'rollover_image' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'Normandy Flax Certified',
                'local_store_available' => true,
                'local_store_name' => 'Goa Panjim Store (In Stock)',
                'express_pincodes' => ['110001', '400001', '560001', '403001'],
                'hotspots' => [],
                'variants' => [
                    ['size' => 'S', 'stock' => 4], ['size' => 'M', 'stock' => 10],
                    ['size' => 'L', 'stock' => 8], ['size' => 'XL', 'stock' => 5],
                ],
            ],
            // --- SHOES 1: Carbon Running Shoes ---
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
                'hotspots' => [],
                'variants' => [
                    ['size' => 'UK 7', 'stock' => 6], ['size' => 'UK 8', 'stock' => 6],
                    ['size' => 'UK 9', 'stock' => 6], ['size' => 'UK 10', 'stock' => 4],
                ],
            ],
            // --- SHOES 2: Classic White Leather Sneakers ---
            [
                'title' => 'Heritage White Low-Top Leather Sneakers',
                'slug' => 'heritage-white-leather-sneakers',
                'category' => 'footwear',
                'brand' => 'AeroGlide',
                'mrp' => 4999, 'price' => 2499,
                'is_new' => true,
                'description' => 'Full-grain Nappa calfskin leather upper with stitched rubber cupsole. Memory foam footbed engineered for all-day urban comfort.',
                'images' => ['https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80'],
                'tags' => ['Full-Grain Leather', 'Memory Foam Insole', 'Minimalist Design'],
                'rollover_image' => 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'Italian Nappa Leather',
                'local_store_available' => true,
                'local_store_name' => 'Bengaluru Commercial Street Store',
                'express_pincodes' => ['110001', '400001', '560001'],
                'hotspots' => [],
                'variants' => [
                    ['size' => 'UK 7', 'stock' => 5], ['size' => 'UK 8', 'stock' => 8],
                    ['size' => 'UK 9', 'stock' => 7], ['size' => 'UK 10', 'stock' => 3],
                ],
            ],
            // --- SHOES 3: Handcrafted Leather Juttis ---
            [
                'title' => 'Handcrafted Royal Tan Genuine Leather Mojari Jutti',
                'slug' => 'royal-tan-leather-juttis',
                'category' => 'footwear',
                'brand' => 'BazaarX Heritage',
                'mrp' => 2999, 'price' => 1499,
                'is_new' => false,
                'description' => 'Handcrafted by artisan shoemakers in Jaipur. 100% genuine vegetable-tanned leather with double-cushioned sole for bite-free comfort.',
                'images' => ['https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80'],
                'tags' => ['Pure Leather', 'Jaipur Handcrafted', 'Bite-Free Insole'],
                'rollover_image' => 'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80',
                'authenticity_grade' => 'Jaipur Craft Certified',
                'local_store_available' => true,
                'local_store_name' => 'Jaipur MI Road Store (In Stock)',
                'express_pincodes' => ['110001', '302001', '400001'],
                'hotspots' => [],
                'variants' => [
                    ['size' => 'UK 6', 'stock' => 3], ['size' => 'UK 7', 'stock' => 5],
                    ['size' => 'UK 8', 'stock' => 5], ['size' => 'UK 9', 'stock' => 4],
                ],
            ],
        ];

        foreach ($productsData as $data) {
            $categorySlug = $data['category'];
            $variants = $data['variants'];
            unset($data['category'], $data['variants']);

            $product = Product::updateOrCreate(
                ['slug' => $data['slug']],
                [
                    ...$data,
                    'category_id' => $categories[$categorySlug]->id,
                    'status' => 'ACTIVE',
                ]
            );

            foreach ($variants as $i => $variant) {
                $product->variants()->updateOrCreate(
                    ['sku' => strtoupper($product->slug).'-'.($i + 1)],
                    [
                        'sku' => strtoupper($product->slug).'-'.($i + 1),
                        ...$variant,
                    ]
                );
            }
        }

        // ── Coupons ──────────────────────────────────────────────────────
        Coupon::updateOrCreate(
            ['code' => 'BHARAT15'],
            [
                'description' => '15% off on clothing & shoes',
                'type' => 'PERCENT',
                'value' => 15,
                'min_order' => 999,
                'max_discount' => 750,
                'usage_limit' => 1000,
                'per_user_limit' => 3,
                'target_type' => 'ALL',
                'expires_at' => now()->addMonths(3),
                'is_active' => true,
            ]
        );
    }
}
