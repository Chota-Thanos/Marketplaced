<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\Contracts\ProductParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProductImportController extends Controller
{
    public function __construct(private ProductParser $parser) {}

    /**
     * Dry run: parse the blob and hand back draft rows with per-field
     * confidence and issues. Writes nothing — the admin reviews and edits
     * before anything is created.
     */
    public function preview(Request $request)
    {
        $validated = $request->validate([
            'raw' => 'required|string|max:500000',
        ]);

        $categories = Category::select('id', 'name', 'slug')->get()->map->only(['id', 'name', 'slug'])->all();

        $result = $this->parser->parse($validated['raw'], ['categories' => $categories]);

        $rows = $result['rows'];

        // Flag titles that clash with the existing catalogue or with each
        // other, so the admin isn't surprised by a slug collision on commit.
        $slugs = array_filter(array_column($rows, 'slug'));
        $existing = Product::whereIn('slug', $slugs)->pluck('slug')->all();
        $seen = [];

        foreach ($rows as &$row) {
            if ($row['slug'] === '') {
                continue;
            }
            if (in_array($row['slug'], $existing, true)) {
                $row['issues'][] = 'A product with this URL slug already exists — it will be given a unique suffix.';
            }
            if (isset($seen[$row['slug']])) {
                $row['issues'][] = 'Duplicate of another row in this import.';
            }
            $seen[$row['slug']] = true;
        }
        unset($row);

        return response()->json([
            'status' => 'success',
            'data' => [
                'format' => $result['format'],
                'driver' => $result['driver'],
                'total' => count($rows),
                'importable' => count(array_filter($rows, fn ($r) => $r['importable'])),
                'categories' => $categories,
                'rows' => $rows,
            ],
        ]);
    }

    /**
     * Create the reviewed rows. All-or-nothing per request so a mid-list
     * failure can't leave a half-imported catalogue.
     */
    public function commit(Request $request)
    {
        $validated = $request->validate([
            'rows' => 'required|array|min:1|max:500',
            'rows.*.title' => 'required|string|max:255',
            'rows.*.description' => 'nullable|string',
            'rows.*.brand' => 'nullable|string|max:255',
            'rows.*.price' => 'required|numeric|min:0',
            'rows.*.mrp' => 'required|numeric|min:0',
            'rows.*.category_id' => 'required|uuid|exists:categories,id',
            'rows.*.images' => 'nullable|array',
            'rows.*.images.*' => 'string',
            'rows.*.tags' => 'nullable|array',
            'rows.*.variants' => 'nullable|array',
            'rows.*.variants.*.color' => 'nullable|string',
            'rows.*.variants.*.size' => 'nullable|string',
            'rows.*.variants.*.sku' => 'nullable|string',
            'rows.*.variants.*.stock' => 'nullable|integer|min:0',
            'status' => 'nullable|in:DRAFT,ACTIVE',
        ]);

        $status = $validated['status'] ?? 'DRAFT';
        $created = [];

        try {
            DB::transaction(function () use ($validated, $status, &$created) {
                foreach ($validated['rows'] as $row) {
                    $product = Product::create([
                        'title' => $row['title'],
                        'slug' => $this->uniqueSlug($row['title']),
                        'description' => $row['description'] ?? null,
                        'brand' => $row['brand'] ?? null,
                        'category_id' => $row['category_id'],
                        'price' => $row['price'],
                        'mrp' => max($row['mrp'], $row['price']),
                        'images' => $row['images'] ?? [],
                        'tags' => $row['tags'] ?? [],
                        'status' => $status,
                        'is_new' => true,
                    ]);

                    $variants = $row['variants'] ?? [];
                    if (! $variants) {
                        $variants = [['color' => null, 'size' => 'Standard', 'stock' => 0, 'sku' => null]];
                    }

                    foreach ($variants as $v) {
                        $product->variants()->create([
                            'color' => $v['color'] ?? null,
                            'size' => $v['size'] ?? null,
                            'sku' => $v['sku'] ?: null,
                            'stock' => $v['stock'] ?? 0,
                        ]);
                    }

                    $created[] = $product->id;
                }
            });
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Import failed and was rolled back: '.$e->getMessage(),
            ], 422);
        }

        return response()->json([
            'status' => 'success',
            'message' => count($created).' product(s) imported as '.$status.'.',
            'data' => [
                'created' => count($created),
                'status' => $status,
                'products' => Product::with(['category', 'variants'])->whereIn('id', $created)->get(),
            ],
        ], 201);
    }

    /** Appends -2, -3… when the base slug is taken. */
    private function uniqueSlug(string $title): string
    {
        $base = Str::slug($title) ?: 'product';
        $slug = $base;
        $n = 2;

        while (Product::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
