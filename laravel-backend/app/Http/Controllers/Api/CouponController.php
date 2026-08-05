<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CouponController extends Controller
{
    /** Customer: preview a coupon against the current cart before checkout. */
    public function preview(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|uuid|exists:products,id',
            'items.*.variant_id' => 'nullable|uuid',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $coupon = Coupon::whereRaw('UPPER(code) = ?', [strtoupper($validated['code'])])->first();

        if (! $coupon) {
            return response()->json(['status' => 'error', 'message' => 'Invalid coupon code.'], 404);
        }

        [$subtotal, $productIds, $categoryIds] = self::summariseCart($validated['items']);

        $error = $coupon->validateFor($request->user(), $subtotal, $productIds, $categoryIds);

        if ($error) {
            return response()->json(['status' => 'error', 'message' => $error], 422);
        }

        $discount = $coupon->discountFor($subtotal);

        return response()->json([
            'status' => 'success',
            'data' => [
                'code' => $coupon->code,
                'description' => $coupon->description,
                'discount' => $discount,
                'subtotal' => $subtotal,
            ],
        ]);
    }

    /**
     * Recompute cart totals server-side from live prices. Never trust a
     * client-sent subtotal — the discount is derived from this, not the payload.
     *
     * @return array{0: float, 1: array<string>, 2: array<string>}
     */
    public static function summariseCart(array $items): array
    {
        $productIds = array_values(array_unique(array_column($items, 'product_id')));
        $products = Product::with('variants')->whereIn('id', $productIds)->get()->keyBy('id');

        $subtotal = 0.0;
        foreach ($items as $item) {
            $product = $products->get($item['product_id']);
            if (! $product) {
                continue;
            }

            $variant = ! empty($item['variant_id'])
                ? $product->variants->firstWhere('id', $item['variant_id'])
                : $product->variants->first();

            $price = $variant ? (float) $variant->effective_price : (float) $product->price;
            $subtotal += $price * $item['quantity'];
        }

        $categoryIds = $products->pluck('category_id')->unique()->values()->all();

        return [round($subtotal, 2), $productIds, $categoryIds];
    }

    // ── Admin CRUD ───────────────────────────────────────────────────────

    public function index()
    {
        $coupons = Coupon::withCount('redemptions')->orderByDesc('created_at')->get();

        return response()->json(['status' => 'success', 'count' => $coupons->count(), 'data' => $coupons]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());
        $validated['code'] = strtoupper($validated['code']);

        $coupon = Coupon::create($validated);

        return response()->json(['status' => 'success', 'data' => $coupon], 201);
    }

    public function update(Request $request, $id)
    {
        $coupon = Coupon::find($id);

        if (! $coupon) {
            return response()->json(['status' => 'error', 'message' => 'Coupon not found'], 404);
        }

        $validated = $request->validate($this->rules($coupon->id));

        if (isset($validated['code'])) {
            $validated['code'] = strtoupper($validated['code']);
        }

        $coupon->update($validated);

        return response()->json(['status' => 'success', 'data' => $coupon->fresh()]);
    }

    public function destroy($id)
    {
        $coupon = Coupon::find($id);

        if (! $coupon) {
            return response()->json(['status' => 'error', 'message' => 'Coupon not found'], 404);
        }

        $coupon->delete();

        return response()->json(['status' => 'success', 'message' => 'Coupon deleted']);
    }

    private function rules(?string $ignoreId = null): array
    {
        $codeRule = Rule::unique('coupons', 'code');
        if ($ignoreId) {
            $codeRule = $codeRule->ignore($ignoreId);
        }

        $required = $ignoreId ? 'sometimes' : 'required';

        return [
            'code' => [$required, 'string', 'max:40', $codeRule],
            'description' => 'nullable|string|max:255',
            'type' => "$required|in:FLAT,PERCENT",
            'value' => "$required|numeric|min:0",
            'min_order' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'per_user_limit' => 'nullable|integer|min:1',
            'target_type' => 'nullable|in:ALL,CATEGORY,PRODUCT',
            'target_ids' => 'nullable|array',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ];
    }
}
