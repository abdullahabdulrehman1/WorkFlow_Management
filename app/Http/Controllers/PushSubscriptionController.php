<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\PushSubscription; // Make sure this path is correct
use Illuminate\Support\Facades\Log;

class PushSubscriptionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum'); // Or your preferred auth middleware
    }

    /**
     * Store a new push subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
            'keys.p256dh' => 'required|string',
            'keys.auth' => 'required|string',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $publicKey = $request->input('keys.p256dh');
            $authToken = $request->input('keys.auth');

            $subscription = $user->pushSubscriptions()->updateOrCreate(
                ['endpoint' => $request->endpoint],
                [
                    'public_key' => $publicKey,
                    'auth_token' => $authToken,
                    'content_encoding' => $request->input('contentEncoding', 'aesgcm'),
                ]
            );

            return response()->json(['success' => true, 'message' => 'Push subscription saved.'], 201);
        } catch (\Exception $e) {
            Log::error('Error storing push subscription: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save subscription'], 500);
        }
    }

    /**
     * Get the VAPID public key.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getVapidPublicKey()
    {
        $publicKey = config('webpush.vapid.public_key');

        if (empty($publicKey)) {
            return response()->json(['error' => 'VAPID public key is not configured.'], 500);
        }

        return response()->json(['vapidPublicKey' => $publicKey]);
    }

    /**
     * Remove the specified push subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|url',
        ]);

        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $deleted = $user->pushSubscriptions()->where('endpoint', $request->endpoint)->delete();

        if ($deleted) {
            return response()->json(['success' => true, 'message' => 'Push subscription removed.']);
        }

        return response()->json(['success' => false, 'message' => 'Push subscription not found.'], 404);
    }
}
