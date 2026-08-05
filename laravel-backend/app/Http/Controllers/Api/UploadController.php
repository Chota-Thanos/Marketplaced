<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/**
 * Local-disk image upload. Stands in for S3/R2 — swap the disk in
 * config/filesystems.php and this controller keeps working unchanged.
 */
class UploadController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,gif,mp4,webm|max:10240',
        ]);

        $path = $request->file('file')->store('uploads', 'public');

        return response()->json([
            'status' => 'success',
            'data' => [
                'path' => $path,
                'url' => asset('storage/'.$path),
            ],
        ], 201);
    }
}
