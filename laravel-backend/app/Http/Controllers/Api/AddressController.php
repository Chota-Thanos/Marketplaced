<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request)
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->get();

        return response()->json(['status' => 'success', 'data' => $addresses]);
    }

    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);
        $user = $request->user();

        $address = DB::transaction(function () use ($validated, $user) {
            // First address a user saves becomes their default automatically.
            $isFirst = $user->addresses()->count() === 0;
            $makeDefault = $validated['is_default'] ?? $isFirst;

            if ($makeDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create([...$validated, 'is_default' => $makeDefault]);
        });

        return response()->json(['status' => 'success', 'data' => $address], 201);
    }

    public function update(Request $request, $id)
    {
        $address = $request->user()->addresses()->find($id);

        if (! $address) {
            return response()->json(['status' => 'error', 'message' => 'Address not found'], 404);
        }

        $validated = $this->validatePayload($request, partial: true);
        $user = $request->user();

        DB::transaction(function () use ($address, $validated, $user) {
            if (! empty($validated['is_default'])) {
                $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }
            $address->update($validated);
        });

        return response()->json(['status' => 'success', 'data' => $address->fresh()]);
    }

    public function destroy(Request $request, $id)
    {
        $address = $request->user()->addresses()->find($id);

        if (! $address) {
            return response()->json(['status' => 'error', 'message' => 'Address not found'], 404);
        }

        $wasDefault = $address->is_default;
        $address->delete();

        // Never leave the user without a default address.
        if ($wasDefault) {
            $next = $request->user()->addresses()->orderBy('created_at')->first();
            $next?->update(['is_default' => true]);
        }

        return response()->json(['status' => 'success', 'message' => 'Address deleted']);
    }

    private function validatePayload(Request $request, bool $partial = false): array
    {
        $rule = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'tag' => 'nullable|string|max:32',
            'name' => "$rule|string|max:255",
            'phone' => "$rule|string|max:20",
            'line1' => "$rule|string|max:255",
            'line2' => 'nullable|string|max:255',
            'city' => "$rule|string|max:120",
            'state' => "$rule|string|max:120",
            'pincode' => "$rule|string|size:6",
            'is_default' => 'nullable|boolean',
        ]);
    }
}
