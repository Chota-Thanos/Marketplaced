<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->user()->notifications()->orderByDesc('created_at');

        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }

        $notifications = $query->limit(50)->get();

        return response()->json([
            'status' => 'success',
            'unread_count' => $request->user()->notifications()->where('is_read', false)->count(),
            'data' => $notifications,
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $notification = $request->user()->notifications()->find($id);

        if (! $notification) {
            return response()->json(['status' => 'error', 'message' => 'Notification not found'], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json(['status' => 'success', 'data' => $notification]);
    }

    public function markAllRead(Request $request)
    {
        $request->user()->notifications()->where('is_read', false)->update(['is_read' => true]);

        return response()->json(['status' => 'success', 'message' => 'All notifications marked read']);
    }

    /** Admin: broadcast to all customers or a single user. */
    public function broadcast(Request $request, NotificationService $notifications)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'nullable|string',
            'type' => 'nullable|string|max:40',
            'user_id' => 'nullable|uuid|exists:users,id',
        ]);

        $type = $validated['type'] ?? 'PROMO';

        $recipients = ! empty($validated['user_id'])
            ? User::where('id', $validated['user_id'])->get()
            : User::where('role', 'CUSTOMER')->where('status', 'ACTIVE')->get();

        $sent = 0;
        foreach ($recipients as $user) {
            if ($notifications->send($user, $type, $validated['title'], $validated['body'] ?? null)) {
                $sent++;
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => "Notification sent to {$sent} customer(s).",
            'skipped' => $recipients->count() - $sent,
        ]);
    }
}
