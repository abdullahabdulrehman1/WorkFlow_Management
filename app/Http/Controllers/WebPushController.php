<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use App\Models\User;
use App\Services\WebPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WebPushController extends Controller
{
    protected $webPushService;

    public function __construct(WebPushService $webPushService)
    {
        $this->webPushService = $webPushService;
    }

    /**
     * Get the VAPID public key.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getVapidPublicKey()
    {
        $vapidPublicKey = config('webpush.vapid.public_key');
        
        if (!$vapidPublicKey) {
            return response()->json([
                'success' => false,
                'error' => 'VAPID public key not found'
            ], 500);
        }
        
        return response()->json([
            'success' => true,
            'vapidPublicKey' => $vapidPublicKey
        ]);
    }

    /**
     * Store a new push subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeSubscription(Request $request)
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
     * Delete a push subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteSubscription(Request $request)
    {
        try {
            $endpoint = $request->input('endpoint');
            
            if (!$endpoint) {
                return response()->json([
                    'success' => false,
                    'error' => 'Endpoint is required'
                ], 422);
            }
            
            $deleted = PushSubscription::where('endpoint', $endpoint)->delete();
            
            return response()->json([
                'success' => true,
                'deleted' => $deleted > 0
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting push subscription: ' . $e->getMessage(), [
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
     * Send a notification to the current user.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendNotification(Request $request)
    {
        try {
            // Get user from auth if available, or get the first user as fallback
            $user = Auth::user();
            
            if (!$user) {
                // No authentication required - use the first user with subscriptions
                $subscription = PushSubscription::first();
                if ($subscription && $subscription->user_id) {
                    $user = \App\Models\User::find($subscription->user_id);
                }
                
                // If still no user, get the first user in the system
                if (!$user) {
                    $user = \App\Models\User::first();
                }
                
                if (!$user) {
                    return response()->json([
                        'sent' => false,
                        'message' => 'No users available to send notification to'
                    ], 404);
                }
            }
            
            $title = $request->input('title', 'Workflow Management');
            $body = $request->input('body', 'You have a new notification');
            $url = $request->input('url', '/');
            
            $payload = [
                'title' => $title,
                'body' => $body,
                'icon' => $request->input('icon', '/logo.png'),
                'url' => $url,
                'tag' => $request->input('tag', 'default'),
                'data' => $request->input('data', []),
            ];
            
            $result = $this->webPushService->notifyUser($user, $payload);
            
            return response()->json([
                'sent' => $result['success'] ?? false,
                'fallbackEnabled' => true,
                'results' => $result['results'] ?? null,
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
     * Send a test notification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendTestNotification(Request $request)
    {
        try {
            Log::debug('Starting test push notification with WebPushController');
            
            // Get user from auth if available, or get the first user as fallback
            $user = Auth::user();
            
            if (!$user) {
                // No authentication required - use the first user with subscriptions
                $subscription = PushSubscription::first();
                if ($subscription && $subscription->user_id) {
                    $user = \App\Models\User::find($subscription->user_id);
                }
                
                // If still no user, get the first user in the system
                if (!$user) {
                    $user = \App\Models\User::first();
                }
                
                if (!$user) {
                    return response()->json([
                        'sent' => false,
                        'message' => 'No users available to send notification to'
                    ], 404);
                }
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
     * Get all subscriptions for the authenticated user.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUserSubscriptions()
    {
        try {
            // Get subscriptions for authenticated user if available
            if (Auth::check()) {
                $subscriptions = PushSubscription::where('user_id', Auth::id())->get();
            } else {
                // Return all subscriptions if not authenticated
                $subscriptions = PushSubscription::all();
            }
            
            return response()->json([
                'success' => true,
                'subscriptions' => $subscriptions
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting user subscriptions: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false, 
                'error' => $e->getMessage()
            ], 500);
        }
    }
}