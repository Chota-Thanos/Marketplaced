<?php

namespace App\Services\Contracts;

interface SearchEngine
{
    /**
     * Search products by keyword, optionally applying filters and sorting.
     */
    public function search(string $query, array $filters = [], string $sortBy = 'relevance'): array;
}
