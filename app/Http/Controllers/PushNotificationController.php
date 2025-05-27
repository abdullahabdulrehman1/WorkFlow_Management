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
use Google\Client;
use Google\Service\FirebaseCloudMessaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;
use Kreait\Firebase\Factory;

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
            
            // Create a new subscription without setting user_id
            // This will make user_id NULL which works with your nullable foreign key
            PushSubscription::create([
                'endpoint' => $request->endpoint,
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
                'content_encoding' => $request->content_encoding ?? 'aes128gcm'
                // Not setting user_id so it will default to NULL
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
     * Store a new FCM token for mobile devices
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeFcmToken(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'device_id' => 'string|nullable',
            'platform' => 'string|nullable'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if this is coming from dev routes
            $isDevelopment = str_contains($request->getPathInfo(), '/dev-api/');
            
            // Get user ID (if authenticated) or use a testing user ID in development
            $userId = null;
            
            if (auth()->check()) {
                $userId = auth()->id();
            } elseif ($isDevelopment) {
                // Use a fake user ID for testing in development
                $userId = $request->input('user_id', 1); // Default to ID 1 for testing
                Log::info('Development FCM token registration with test user ID: ' . $userId);
            }
            
            // Delete existing tokens for this device to avoid duplicates
            if ($request->has('device_id')) {
                PushSubscription::where([
                    'device_id' => $request->device_id,
                ])->delete();
            }
            
            // Store as a special type of subscription
            PushSubscription::create([
                'endpoint' => $request->token, // Store FCM token as the endpoint
                'user_id' => $userId,
                'device_id' => $request->device_id ?? null,
                'platform' => $request->platform ?? 'android',
                'content_encoding' => 'fcm' // Mark this as an FCM subscription
            ]);

            return response()->json(['success' => true]);
        } catch (Exception $e) {
            Log::error('Error storing FCM token: ' . $e->getMessage(), [
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
            
            // Create Firebase messaging instance for FCM tokens
            $firebase = null;
            $firebaseConfigPath = base_path('firebase-credentials.json');
            if (file_exists($firebaseConfigPath)) {
                $firebase = (new Factory)
                    ->withServiceAccount($firebaseConfigPath)
                    ->createMessaging();
            }
            
            $webPush = new WebPush($auth);
            $sentCount = 0;
            $failedCount = 0;
            
            // Create payload with minimal data
            $payload = json_encode([
                'title' => $request->input('title', 'Workflow Management'),
                'body' => $request->input('body', 'You have a new notification'),
                'icon' => '/logo.png'
            ]);
            
            // Group subscriptions by type
            $webSubscriptions = $subscriptions->where('content_encoding', '!=', 'fcm')->values();
            $fcmSubscriptions = $subscriptions->where('content_encoding', 'fcm')->values();
            
            // Process web push subscriptions
            foreach ($webSubscriptions as $sub) {
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
            
            // Send web push notifications
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
            
            // Process FCM subscriptions
            if ($firebase && $fcmSubscriptions->count() > 0) {
                $fcmPayload = [
                    'title' => $request->input('title', 'Workflow Management'),
                    'body' => $request->input('body', 'You have a new notification')
                ];
                
                foreach ($fcmSubscriptions as $sub) {
                    try {
                        $message = CloudMessage::withTarget('token', $sub->endpoint)
                            ->withNotification(FirebaseNotification::create(
                                $fcmPayload['title'],
                                $fcmPayload['body']
                            ))
                            ->withData([
                                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                                'id' => '1', 
                                'status' => 'done',
                                'url' => $request->input('url', '/')
                            ]);
                            
                        $firebase->send($message);
                        $sentCount++;
                    } catch (Exception $e) {
                        Log::error('Error sending FCM message: ' . $e->getMessage());
                        $failedCount++;
                        
                        // If the token is invalid or expired, remove it
                        if (strpos($e->getMessage(), 'registration-token-not-registered') !== false) {
                            PushSubscription::where('endpoint', $sub->endpoint)->delete();
                        }
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

    /**
     * Send a call notification to a specific user via FCM
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendCallNotification(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'caller_id' => 'required|string',
            'caller_name' => 'required|string',
            'call_type' => 'required|in:call,video_call',
            'call_id' => 'string|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $userId = $request->user_id;
            $callerId = $request->caller_id;
            $callerName = $request->caller_name;
            $callType = $request->call_type;
            $callId = $request->call_id ?? uniqid('call-');

            // Find FCM tokens for the specific user
            $subscriptions = PushSubscription::where([
                'user_id' => $userId,
                'content_encoding' => 'fcm'
            ])->get();

            if ($subscriptions->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No FCM tokens found for this user'
                ], 404);
            }

            // Create Firebase messaging instance
            $firebaseConfigPath = base_path('firebase-credentials.json');
            if (!file_exists($firebaseConfigPath)) {
                throw new Exception('Firebase credentials not found');
            }

            $firebase = (new Factory)
                ->withServiceAccount($firebaseConfigPath)
                ->createMessaging();

            $sentCount = 0;
            $failedCount = 0;

            // Send to each device token
            foreach ($subscriptions as $sub) {
                try {
                    // For killed app scenarios, send DATA-ONLY message to prevent auto-notification
                    // This ensures MyFirebaseMessagingService handles the notification display
                    $message = CloudMessage::withTarget('token', $sub->endpoint)
                        ->withData([
                            'type' => $callType,
                            'callerId' => $callerId,
                            'callerName' => $callerName,
                            'callId' => $callId,
                            'high_priority' => 'true',
                            'content_available' => 'true',
                            'title' => ($callType === 'video_call' ? 'Video Call' : 'Voice Call'),
                            'body' => $callerName
                        ])
                        ->withAndroidConfig([
                            'priority' => 'high',
                            'data' => [
                                'type' => $callType,
                                'callerId' => $callerId,
                                'callerName' => $callerName,
                                'callId' => $callId
                            ]
                        ]);

                    $firebase->send($message);
                    $sentCount++;
                } catch (Exception $e) {
                    Log::error('Error sending FCM call notification: ' . $e->getMessage());
                    $failedCount++;
                    
                    // If the token is invalid, remove it
                    if (strpos($e->getMessage(), 'registration-token-not-registered') !== false) {
                        PushSubscription::where('endpoint', $sub->endpoint)->delete();
                    }
                }
            }

            return response()->json([
                'success' => $sentCount > 0,
                'call_id' => $callId,
                'stats' => [
                    'sent' => $sentCount,
                    'failed' => $failedCount
                ]
            ]);

        } catch (Exception $e) {
            Log::error('Call notification error: ' . $e->getMessage(), [
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
     * Send a call notification to ALL FCM devices (simplified version)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendCallNotificationToAll(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => 'required|string',
            'call_type' => 'required|in:call,video_call',
            'caller_name' => 'required|string',
            'caller_id' => 'required|string',
            'call_id' => 'string|nullable',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $phoneNumber = $request->phone_number;
            $callType = $request->call_type;
            $callerName = $request->caller_name;
            $callerId = $request->caller_id;
            $callId = $request->call_id ?? uniqid('call-');

            // Find ALL FCM tokens (not user-specific)
            $subscriptions = PushSubscription::where('content_encoding', 'fcm')->get();

            if ($subscriptions->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No FCM tokens found for call notification'
                ], 404);
            }

            $firebase = (new Factory)
                ->withServiceAccount(base_path('firebase-credentials.json'))
                ->createMessaging();

            $sentCount = 0;
            $failedCount = 0;

            foreach ($subscriptions as $sub) {
                try {
                    $message = CloudMessage::withTarget('token', $sub->endpoint)
                        ->withData([
                            'type' => $callType,
                            'callerId' => $callerId,
                            'callerName' => $callerName,
                            'phoneNumber' => $phoneNumber,
                            'callId' => $callId,
                            'high_priority' => 'true',
                            'content_available' => 'true'
                        ])
                        ->withAndroidConfig([
                            'priority' => 'high',
                            'data' => [
                                'type' => $callType,
                                'callerId' => $callerId,
                                'callerName' => $callerName,
                                'phoneNumber' => $phoneNumber,
                                'callId' => $callId
                            ]
                        ]);

                    $firebase->send($message);
                    $sentCount++;
                } catch (Exception $e) {
                    $failedCount++;
                    if (strpos($e->getMessage(), 'registration-token-not-registered') !== false) {
                        PushSubscription::where('endpoint', $sub->endpoint)->delete();
                    }
                }
            }

            return response()->json([
                'success' => $sentCount > 0,
                'call_id' => $callId,
                'sent_count' => $sentCount,
                'failed_count' => $failedCount,
                'message' => "Call notification: $sentCount sent, $failedCount failed"
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the count of FCM tokens
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTokenCount()
    {
        try {
            $count = PushSubscription::where('content_encoding', 'fcm')->count();
            
            Log::info('FCM token count requested', ['count' => $count]);
            
            return response()->json([
                'success' => true,
                'count' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting FCM token count', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error getting FCM token count: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Check if Firebase configuration file exists
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkFirebaseConfig()
    {
        try {
            $configPath = base_path('firebase-credentials.json');
            $exists = file_exists($configPath);
            
            Log::info('Firebase config check', [
                'exists' => $exists,
                'path' => $configPath
            ]);
            
            if ($exists) {
                // Check if file is readable and valid JSON
                $isReadable = is_readable($configPath);
                $isValidJson = false;
                
                if ($isReadable) {
                    try {
                        $content = file_get_contents($configPath);
                        json_decode($content);
                        $isValidJson = (json_last_error() === JSON_ERROR_NONE);
                    } catch (\Exception $e) {
                        $isReadable = false;
                    }
                }
                
                return response()->json([
                    'success' => true,
                    'exists' => true,
                    'path' => $configPath,
                    'readable' => $isReadable,
                    'valid_json' => $isValidJson,
                    'message' => $isValidJson ? 'Firebase configuration file exists and is valid' : 
                                 ($isReadable ? 'Firebase configuration exists but is not valid JSON' : 
                                              'Firebase configuration exists but is not readable')
                ]);
            } else {
                return response()->json([
                    'success' => true,
                    'exists' => false,
                    'path' => $configPath,
                    'message' => 'Firebase configuration file does not exist'
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error checking Firebase config', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error checking Firebase config: ' . $e->getMessage()
            ], 500);
        }
    }
}
