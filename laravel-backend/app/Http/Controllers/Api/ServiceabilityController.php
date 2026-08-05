<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Contracts\LogisticsProvider;
use Illuminate\Http\Request;

class ServiceabilityController extends Controller
{
    public function check(Request $request, LogisticsProvider $logistics)
    {
        $validated = $request->validate(['pincode' => 'required|string|size:6']);

        return response()->json([
            'status' => 'success',
            'data' => $logistics->isServiceable($validated['pincode']),
        ]);
    }
}
