<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BundleDeal;
use Illuminate\Http\Request;

class BundleDealController extends Controller
{
    public function index()
    {
        $deals = BundleDeal::where('is_active', true)
            ->where(function($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->with(['primaryProduct:id,name,base_price', 'secondaryProduct:id,name,base_price'])
            ->get();

        return response()->json($deals);
    }
}
