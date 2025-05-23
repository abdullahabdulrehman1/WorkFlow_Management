<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class PushNotificationController extends Controller
{
    protected $webPushService;

    public function __construct(WebPushService $webPushService)
    {
        $this->webPushService = $webPushService;
    }

    /**
     * Store a new push notification subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function subscribe(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'endpoint' => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Delete existing subscriptions with the same endpoint
            PushSubscription::where('endpoint', $request->endpoint)->delete();
            
            // Create a new subscription
            $subscription = new PushSubscription([
                'endpoint' => $request->endpoint,
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
                'content_encoding' => $request->content_encoding ?? 'aes128gcm'
            ]);
            
            // Associate with user if authenticated
            if (Auth::check()) {
                $subscription->user_id = Auth::id();
            }
            
            $subscription->save();

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error storing push subscription: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false, 
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Send a push notification to all subscriptions or specific user.
     * REPLACED to avoid any Minishlink references
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function send(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'body' => 'required|string',
            'user_id' => 'nullable|integer|exists:users,id',
            'url' => 'nullable|string',
            'icon' => 'nullable|string',
            'badge' => 'nullable|string',
            'tag' => 'nullable|string',
            'data' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Build payload for the notification
            $payload = [
                'title' => $request->title,
                'body' => $request->body,
                'icon' => $request->input('icon', '/logo.png'),
                'badge' => $request->input('badge', '/logo.png'),
                'url' => $request->input('url', '/'),
                'tag' => $request->input('tag', 'default'),
                'data' => $request->input('data', []),
            ];
            
            // Send to specific user if user_id provided
            if ($request->has('user_id')) {
                $user = User::find($request->user_id);
                if (!$user) {
                    return response()->json([
                        'sent' => false,
                        'message' => 'User not found'
                    ], 404);
                }
                
                // Send notification using WebPushService
                $result = $this->webPushService->notifyUser($user, $payload);
                
                return response()->json([
                    'sent' => $result['success'] ?? false,
                    'message' => 'Notification sent to user',
                    'results' => $result
                ]);
            }
            
            // No specific user, send to all subscriptions
            $subscriptions = PushSubscription::all();
            
            if ($subscriptions->isEmpty()) {
                return response()->json([
                    'sent' => false,
                    'message' => 'No subscriptions found'
                ], 404);
            }
            
            // Format subscriptions for the WebPushService
            $formattedSubscriptions = $subscriptions->map(function($sub) {
                return [
                    'endpoint' => $sub->endpoint,
                    'keys' => [
                        'p256dh' => $sub->public_key,
                        'auth' => $sub->auth_token,
                    ],
                ];
            })->toArray();
            
            // Send notification using WebPushService
            $result = $this->webPushService->sendBulkNotifications($formattedSubscriptions, $payload);
            
            return response()->json([
                'sent' => $result['success'] ?? false,
                'message' => 'Notification sent to all subscriptions',
                'count' => $subscriptions->count(),
                'results' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Push notification error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'sent' => false,
                'error' => 'Push notification failed: ' . $e->getMessage(),
                'fallbackEnabled' => true
            ], 500);
        }
    }
    
    /**
     * Send a test push notification.
     * COMPLETELY REWRITTEN to avoid Minishlink references.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendTestPush(Request $request)
    {
        try {
            Log::debug('Starting test push notification with direct WebPushService');
            
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized - user not authenticated'], 401);
            }
            
            $payload = [
                'title' => 'Test Notification',
                'body' => 'This is a test notification from Workflow Management',
                'icon' => '/logo.png',
                'url' => $request->input('url', '/notification-test')
            ];
            
            // Directly use our WebPushService
            $result = $this->webPushService->notifyUser($user, $payload);
            
            return response()->json([
                'sent' => $result['success'] ?? false,
                'message' => 'Test notification sent through WebPushService',
                'results' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Test push notification failed: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'sent' => false,
                'error' => 'Test push notification failed: ' . $e->getMessage(),
                'fallbackEnabled' => true
            ], 500);
        }
    }
    
    /**
     * Get all subscriptions for the authenticated user or all if no user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserSubscriptions(Request $request)
    {
        // Get subscriptions for authenticated user if available
        if (Auth::check()) {
            $subscriptions = PushSubscription::where('user_id', Auth::id())->get();
        } else {
            // Otherwise, try to get subscriptions by endpoint if provided
            if ($request->has('endpoint')) {
                $subscriptions = PushSubscription::where('endpoint', $request->endpoint)->get();
            } else {
                // Return all subscriptions if no filter
                $subscriptions = PushSubscription::all();
            }
        }
        
        return response()->json([
            'success' => true,
            'subscriptions' => $subscriptions
        ]);
    }
}
