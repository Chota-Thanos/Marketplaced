<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Wishlist;
use App\Models\WishlistItem;
use App\Models\Product;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class CheckPriceDrops extends Command
{
    protected $signature = 'alerts:price-drop';
    protected $description = 'Check wishlists for price drops and notify users';

    public function handle()
    {
        $items = WishlistItem::with(['product', 'wishlist.user'])->get();
        $count = 0;

        foreach ($items as $item) {
            if (!$item->product || !$item->wishlist->user) continue;

            // Simple logic: if current base price is less than price_at_add
            if ($item->product->base_price < $item->price_at_add) {
                // Mock dispatch notification
                NotificationService::dispatchEmail(
                    $item->wishlist->user->email,
                    "Price drop alert! {$item->product->name} is now cheaper.",
                    "Price dropped from {$item->price_at_add} to {$item->product->base_price}."
                );
                
                // Update price_at_add so we don't alert again unless it drops further
                $item->price_at_add = $item->product->base_price;
                $item->save();
                $count++;
            }
        }

        $this->info("Dispatched {$count} price drop alerts.");
        Log::info("Dispatched {$count} price drop alerts.");
    }
}
