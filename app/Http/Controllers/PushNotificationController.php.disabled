<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Exception;
use Minishlink\WebPush\Encryption;

class PushNotificationController extends Controller
{
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
            // Delete existing subscriptions with the same endpoint to avoid duplicates
            PushSubscription::where('endpoint', $request->endpoint)->delete();
            
            // Create a new subscription
            PushSubscription::create([
                'endpoint' => $request->endpoint,
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
                'content_encoding' => $request->content_encoding ?? 'aes128gcm'
            ]);

            return response()->json(['success' => true]);
        } catch (Exception $e) {
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
     * Send a test push notification to all subscribed devices.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendTestPush(Request $request)
    {
        try {
            $subscriptions = PushSubscription::all();
            
            if ($subscriptions->isEmpty()) {
                return response()->json([
                    'sent' => false,
                    'message' => 'No subscriptions found'
                ], 404);
            }
            
            // Configure PHP OpenSSL for Windows
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                // Set proper OpenSSL config for Windows
                putenv('OPENSSL_CONF=');
                
                // Increase memory limit temporarily for encryption operations
                ini_set('memory_limit', '256M');
            }
            
            // Get VAPID configuration from .env
            $vapidSubject = config('webpush.vapid.subject');
            $vapidPublicKey = config('webpush.vapid.public_key');
            $vapidPrivateKey = config('webpush.vapid.private_key');
            
            if (!$vapidPublicKey || !$vapidPrivateKey) {
                throw new Exception('VAPID keys are not properly configured');
            }
            
            // Create WebPush instance with minimal configuration
            $auth = [
                'VAPID' => [
                    'subject' => $vapidSubject,
                    'publicKey' => $vapidPublicKey,
                    'privateKey' => $vapidPrivateKey,
                ],
                'contentEncoding' => 'aes128gcm'
            ];
            
            $webPush = new WebPush($auth);
            $sentCount = 0;
            $failedCount = 0;
            
            // Create payload with minimal data
            $payload = json_encode([
                'title' => $request->input('title', 'Workflow Management'),
                'body' => $request->input('body', 'You have a new notification'),
                'icon' => '/logo.png'
            ]);
            
            // Process each subscription with individual error handling
            foreach ($subscriptions as $sub) {
                try {
                    // Create subscription object with proper format
                    $subscription = Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'keys' => [
                            'p256dh' => $sub->public_key,
                            'auth' => $sub->auth_token,
                        ],
                        'contentEncoding' => 'aes128gcm'
                    ]);
                    
                    // Queue notification
                    $webPush->queueNotification($subscription, $payload);
                } catch (Exception $e) {
                    Log::error('Error queueing notification: ' . $e->getMessage());
                    $failedCount++;
                }
            }
            
            // Send all notifications
            $results = [];
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                
                if ($report->isSuccess()) {
                    $sentCount++;
                    $results[] = [
                        'endpoint' => $endpoint,
                        'status' => 'success'
                    ];
                } else {
                    $failedCount++;
                    $results[] = [
                        'endpoint' => $endpoint,
                        'status' => 'failed',
                        'reason' => $report->getReason()
                    ];
                    
                    if ($report->getStatusCode() === 410) {
                        PushSubscription::where('endpoint', $endpoint)->delete();
                    }
                }
            }
            
            // Return success if any notifications were sent
            return response()->json([
                'sent' => $sentCount > 0,
                'stats' => [
                    'sent' => $sentCount,
                    'failed' => $failedCount
                ],
                'fallbackEnabled' => $sentCount === 0
            ]);
            
        } catch (Exception $e) {
            Log::error('Push notification error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // For debugging purposes, you can include more details
            return response()->json([
                'sent' => false,
                'fallbackEnabled' => true,
                'error' => 'Push notification failed: ' . $e->getMessage(),
                'errorDetails' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ]);
        }
    }
}
