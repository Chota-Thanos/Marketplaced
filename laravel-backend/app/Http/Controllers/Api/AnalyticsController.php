<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ReturnRequest;
use App\Models\SearchQuery;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $days = (int) $request->get('days', 30);
        $days = max(1, min($days, 365));
        $since = now()->subDays($days)->startOfDay();

        // CANCELLED orders never produced revenue, so they're excluded from
        // every money figure below.
        $revenueScope = fn () => Order::where('created_at', '>=', $since)
            ->where('status', '!=', 'CANCELLED');

        $revenueTotal = (float) $revenueScope()->sum('total_amount');
        $ordersTotal = (int) $revenueScope()->count();

        $returnsInWindow = ReturnRequest::where('created_at', '>=', $since)->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'days' => $days,
                'revenue_total' => $revenueTotal,
                'orders_total' => $ordersTotal,
                'average_order_value' => $ordersTotal > 0 ? round($revenueTotal / $ordersTotal, 2) : 0,
                'new_customers' => User::where('created_at', '>=', $since)->where('role', 'CUSTOMER')->count(),
                'active_returns' => ReturnRequest::whereIn('status', ['REQUESTED', 'APPROVED', 'PICKED_UP'])->count(),
                'return_rate' => $ordersTotal > 0 ? round(($returnsInWindow / $ordersTotal) * 100, 1) : 0.0,
                'revenue_series' => $this->revenueSeries($since, $days),
                'top_products' => $this->topProducts($since),
                'category_split' => $this->categorySplit($since),
                'top_searches' => $this->topSearches($since),
                'zero_result_searches' => $this->zeroResultSearches($since),
            ],
        ]);
    }

    /** Daily revenue, zero-filled so the chart has no gaps on quiet days. */
    private function revenueSeries($since, int $days): array
    {
        $rows = Order::where('created_at', '>=', $since)
            ->where('status', '!=', 'CANCELLED')
            ->selectRaw('DATE(created_at) as day, SUM(total_amount) as revenue, COUNT(*) as orders')
            ->groupBy('day')
            ->get()
            ->keyBy(fn ($r) => (string) $r->day)
            ->map(fn ($r) => ['revenue' => (float) $r->revenue, 'orders' => (int) $r->orders])
            ->all();

        $series = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $series[] = [
                'date' => $date,
                'revenue' => (float) ($rows[$date]['revenue'] ?? 0),
                'orders' => (int) ($rows[$date]['orders'] ?? 0),
            ];
        }

        return $series;
    }

    private function topProducts($since): array
    {
        return OrderItem::whereHas('order', fn ($q) => $q->where('created_at', '>=', $since)->where('status', '!=', 'CANCELLED'))
            ->select('product_id')
            ->selectRaw('SUM(quantity) as units')
            ->selectRaw('SUM(price * quantity) as revenue')
            ->groupBy('product_id')
            ->orderByDesc('revenue')
            ->limit(8)
            ->with('product:id,title')
            ->get()
            ->map(fn ($row) => [
                'id' => $row->product_id,
                'title' => $row->product?->title ?? 'Deleted product',
                'units' => (int) $row->units,
                'revenue' => (float) $row->revenue,
            ])
            ->all();
    }

    private function categorySplit($since): array
    {
        return OrderItem::whereHas('order', fn ($q) => $q->where('created_at', '>=', $since)->where('status', '!=', 'CANCELLED'))
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select('categories.name')
            ->selectRaw('SUM(order_items.price * order_items.quantity) as revenue')
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => ['name' => $row->name, 'revenue' => (float) $row->revenue])
            ->all();
    }

    private function topSearches($since): array
    {
        return SearchQuery::where('created_at', '>=', $since)
            ->select('normalised_query')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('normalised_query')
            ->orderByDesc('count')
            ->limit(8)
            ->get()
            ->map(fn ($r) => ['normalised_query' => $r->normalised_query, 'count' => (int) $r->count])
            ->all();
    }

    /** Queries that returned nothing — these are inventory gap signals. */
    private function zeroResultSearches($since): array
    {
        return SearchQuery::where('created_at', '>=', $since)
            ->where('result_count', 0)
            ->select('normalised_query')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('normalised_query')
            ->orderByDesc('count')
            ->limit(8)
            ->get()
            ->map(fn ($r) => ['normalised_query' => $r->normalised_query, 'count' => (int) $r->count])
            ->all();
    }
}
