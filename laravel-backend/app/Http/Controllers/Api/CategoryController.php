<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::withCount('products')->orderBy('sort_order');

        if ($request->boolean('tree')) {
            $categories = $query->whereNull('parent_id')->with('children')->get();
        } else {
            $categories = $query->get();
        }

        return response()->json(['status' => 'success', 'count' => $categories->count(), 'data' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'nullable|string|unique:categories,slug',
            'parent_id' => 'nullable|uuid|exists:categories,id',
            'icon_url' => 'nullable|string',
            'banner_url' => 'nullable|string',
            'filter_config' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'is_featured' => 'nullable|boolean',
        ]);

        $validated['slug'] = $validated['slug'] ?? Str::slug($validated['name']);

        $category = Category::create($validated);

        return response()->json(['status' => 'success', 'data' => $category], 201);
    }

    public function show($id)
    {
        $category = Category::with('children')->find($id);

        if (! $category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        return response()->json(['status' => 'success', 'data' => $category]);
    }

    public function update(Request $request, $id)
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'slug' => ['sometimes', 'string', Rule::unique('categories', 'slug')->ignore($category->id)],
            'parent_id' => 'nullable|uuid|exists:categories,id|not_in:'.$category->id,
            'icon_url' => 'nullable|string',
            'banner_url' => 'nullable|string',
            'filter_config' => 'nullable|array',
            'sort_order' => 'nullable|integer',
            'is_featured' => 'nullable|boolean',
        ]);

        $category->update($validated);

        return response()->json(['status' => 'success', 'data' => $category]);
    }

    public function destroy($id)
    {
        $category = Category::find($id);

        if (! $category) {
            return response()->json(['status' => 'error', 'message' => 'Category not found'], 404);
        }

        $category->delete();

        return response()->json(['status' => 'success', 'message' => 'Category deleted successfully']);
    }
}
