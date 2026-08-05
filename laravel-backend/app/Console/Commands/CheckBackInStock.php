<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Wishlist;
use App\Models\WishlistItem;
use App\Models\ProductVariant;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class CheckBackInStock extends Command
{
    protected $signature = 'alerts:back-in-stock';
    protected $description = 'Check wishlists for restocked items and notify users';

    public function handle()
    {
        // Find wishlist items where the product variant was out of stock but is now in stock.
        // For simplicity, we assume we just check if any variant of the product is in stock now
        // if they wishlisted a product that was totally out of stock.
        
        $items = WishlistItem::with(['product.variants', 'wishlist.user'])->get();
        $count = 0;

        foreach ($items as $item) {
            if (!$item->product || !$item->wishlist->user) continue;

            $totalStock = $item->product->variants->sum('stock');
            
            // Assuming we added a 'was_out_of_stock' flag to wishlist item, 
            // or we just check if totalStock > 0 and previously we knew they wanted it.
            // For mock purposes, let's pretend we have a condition:
            if ($totalStock > 0) {
                // This would normally check against a specific flag to not spam them.
                // We'll mock it here.
                NotificationService::dispatchEmail(
                    $item->wishlist->user->email,
                    "Back in stock alert! {$item->product->name} is available.",
                    "Hurry, {$item->product->name} is back in stock."
                );
                $count++;
            }
        }

        $this->info("Dispatched {$count} back-in-stock alerts.");
        Log::info("Dispatched {$count} back-in-stock alerts.");
    }
}
