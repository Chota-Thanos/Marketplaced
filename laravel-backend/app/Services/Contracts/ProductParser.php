<?php

namespace App\Services\Contracts;

interface ProductParser
{
    /**
     * Turn an arbitrary blob of product data into structured draft rows.
     *
     * Implementations must never throw on malformed input — unparseable rows
     * come back with `issues` populated so the admin can fix them in the
     * review step rather than the whole import failing.
     *
     * @param  string  $raw       Pasted text, CSV/TSV, JSON, or a markdown table.
     * @param  array   $context   ['categories' => [['id','name','slug'), ...]]
     * @return array{rows: array, format: string, driver: string}
     */
    public function parse(string $raw, array $context = []): array;
}
