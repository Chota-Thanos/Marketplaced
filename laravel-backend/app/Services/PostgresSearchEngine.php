<?php

namespace App\Services;

use App\Models\Product;
use App\Services\Contracts\SearchEngine;

class PostgresSearchEngine implements SearchEngine
{
    public function search(string $query, array $filters = [], string $sortBy = 'relevance'): array
    {
        $products = Product::query()
            ->where('status', 'ACTIVE');

        if (!empty($query)) {
            if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
                $products->whereRaw("search_vector @@ plainto_tsquery('english', ?)", [$query])
                         ->orderByRaw("ts_rank(search_vector, plainto_tsquery('english', ?)) DESC", [$query]);
            } else {
                $products->where(function ($q) use ($query) {
                    $q->where('title', 'like', "%{$query}%")
                      ->orWhere('brand', 'like', "%{$query}%")
                      ->orWhere('description', 'like', "%{$query}%");
                });
            }
        }

        // Apply filters
        if (!empty($filters['category_id'])) {
            $products->where('category_id', $filters['category_id']);
        }
        
        if (!empty($filters['min_price'])) {
            $products->where('price', '>=', $filters['min_price']);
        }

        if (!empty($filters['max_price'])) {
            $products->where('price', '<=', $filters['max_price']);
        }

        if (!empty($filters['brand'])) {
            $products->where('brand', $filters['brand']);
        }

        // Additional sorts (override relevance if specified)
        if ($sortBy === 'price_asc') {
            $products->reorder('price', 'asc');
        } elseif ($sortBy === 'price_desc') {
            $products->reorder('price', 'desc');
        } elseif ($sortBy === 'newest') {
            $products->reorder('created_at', 'desc');
        }

        // Return a paginated collection
        return $products->paginate(24)->toArray();
    }
}
