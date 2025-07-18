<?php
use App\Http\Controllers\ActionController;
use App\Http\Controllers\PushNotificationController;
use App\Http\Controllers\TriggerController;
use App\Http\Controllers\WorkflowController;
use App\Events\TestBroadcast;
use App\Events\WorkflowEvent;
use App\Events\DesktopCallEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Vite asset proxy for ngrok (prevents Mixed Content errors)
Route::get('/vite-proxy/{path}', function (Request $request, $path) {
    $viteUrl = "http://192.168.20.65:5173/{$path}";
    
    try {
        $response = file_get_contents($viteUrl);
        $contentType = 'text/javascript';
        
        if (str_ends_with($path, '.css')) {
            $contentType = 'text/css';
        } elseif (str_ends_with($path, '.js') || str_ends_with($path, '.jsx')) {
            $contentType = 'text/javascript';
        }
        
        return response($response)->header('Content-Type', $contentType);
    } catch (Exception $e) {
        return response('Vite asset not found', 404);
    }
})->where('path', '.*');

// Web routes with normal CSRF protection
Route::get('/', function () {
    return Inertia::render('App');
});

Route::get('/workflows', function () {
    return Inertia::render('Workflows');
});

Route::get('/create-new-workflow', function () {
    return Inertia::render('CreateNewWorkflow');
});

// Call screen route
Route::get('/call/{callId}', function (Request $request, $callId) {
    return Inertia::render('Call', [
        'callId' => $callId,
        'callType' => $request->query('type', 'audio'),
        'recipientId' => $request->query('recipient'),
        'callerName' => $request->query('caller')
    ]);
});

// Call decision screen route
Route::get('/call-decision/{callId}', function (Request $request, $callId) {
    return Inertia::render('CallDecision', [
        'callId' => $callId,
        'callType' => $request->query('type', 'audio'),
        'recipientId' => $request->query('recipient'),
        'callerName' => $request->query('caller')
    ]);
});

// Call test route - using simple closure instead of CallController
Route::get('/call-test', function (Request $request) {
    $phoneNumber = $request->query('phone');
    $isVideo = filter_var($request->query('video', 'false'), FILTER_VALIDATE_BOOLEAN);
    
    return inertia('CallTest', [
        'phoneNumber' => $phoneNumber,
        'isVideo' => $isVideo,
    ]);
})->name('call.test');

// Push Notification Routes - No authentication for testing
Route::post('/api/subscribe', [PushNotificationController::class, 'subscribe']);
Route::post('/api/push-notify', [PushNotificationController::class, 'sendTestPush']);

// FCM token routes for mobile devices - No authentication for testing
Route::post('/api/fcm/register', [PushNotificationController::class, 'storeFcmToken']);
Route::get('/api/fcm/tokens/count', [PushNotificationController::class, 'getTokenCount']);

// Firebase config check route
Route::get('/api/firebase/config/check', [PushNotificationController::class, 'checkFirebaseConfig']);

// Call notification route - Notify ALL users (simplified)
Route::post('/api/calls/notify', [PushNotificationController::class, 'sendCallNotificationToAll']);

// iOS CallKit notification route - Send push notifications that trigger CallKit
Route::post('/api/calls/ios-notify', [PushNotificationController::class, 'sendIOSCallNotification']);

// Debug route to test FCM CallKit flow step by step
Route::post('/api/debug/ios-call-test', function (Request $request) {
    try {
        Log::info('🧪 [DEBUG] iOS Call Test Started');
        
        // Step 1: Check if we have iOS tokens
        $iosTokens = \App\Models\PushSubscription::where('content_encoding', 'aes128gcm')
            ->where('platform', 'ios')
            ->where('endpoint', 'like', 'https://fcm.googleapis.com/fcm/send/%')
            ->get();
        
        Log::info('🧪 [DEBUG] Found iOS tokens', ['count' => $iosTokens->count()]);
        
        if ($iosTokens->isEmpty()) {
            return response()->json([
                'success' => false,
                'step' => 'token_check',
                'message' => 'No iOS FCM tokens found in database',
                'debug' => [
                    'total_aes128gcm_tokens' => \App\Models\PushSubscription::where('content_encoding', 'aes128gcm')->count(),
                    'total_fcm_tokens' => \App\Models\PushSubscription::where('content_encoding', 'fcm')->count(),
                    'platforms' => \App\Models\PushSubscription::where('content_encoding', 'aes128gcm')->pluck('platform')->unique(),
                    'sample_endpoints' => \App\Models\PushSubscription::where('content_encoding', 'aes128gcm')->pluck('endpoint')->take(3)
                ]
            ]);
        }
        
        // Step 2: Check Firebase config
        $firebaseConfigPath = base_path('firebase-credentials.json');
        if (!file_exists($firebaseConfigPath)) {
            Log::error('🧪 [DEBUG] Firebase config missing');
            return response()->json([
                'success' => false,
                'step' => 'firebase_config',
                'message' => 'Firebase credentials file not found',
                'path' => $firebaseConfigPath
            ]);
        }
        
        Log::info('🧪 [DEBUG] Firebase config exists');
        
        // Step 3: Try to send FCM notification
        $firebase = (new \Kreait\Firebase\Factory)
            ->withServiceAccount($firebaseConfigPath)
            ->createMessaging();
        
        $testCallerName = $request->input('caller_name', 'Debug Test Call');
        $testCallId = 'debug-' . time();
        
        $sentCount = 0;
        $errors = [];
        
        foreach ($iosTokens as $subscription) {
            try {
                // Extract FCM token from the full endpoint URL
                $fcmToken = str_replace('https://fcm.googleapis.com/fcm/send/', '', $subscription->endpoint);
                
                Log::info('🧪 [DEBUG] Sending to iOS device', [
                    'device_id' => $subscription->device_id,
                    'token_preview' => substr($fcmToken, 0, 20) . '...'
                ]);
                
                $message = \Kreait\Firebase\Messaging\CloudMessage::withTarget('token', $fcmToken)
                    ->withNotification(\Kreait\Firebase\Messaging\Notification::create(
                        'Incoming Call from ' . $testCallerName,
                        'Tap to answer the call'
                    ))
                    ->withData([
                        'type' => 'ios_call',
                        'callType' => 'voice',
                        'callerId' => 'debug_caller',
                        'callerName' => $testCallerName,
                        'callId' => $testCallId,
                        'timestamp' => now()->toISOString(),
                        'triggerCallKit' => 'true'
                    ])
                    ->withApnsConfig([
                        'headers' => [
                            'apns-priority' => '10',
                            'apns-push-type' => 'alert'
                        ],
                        'payload' => [
                            'aps' => [
                                'alert' => [
                                    'title' => 'Incoming Call from ' . $testCallerName,
                                    'body' => 'Tap to answer the call'
                                ],
                                'sound' => 'default',
                                'badge' => 1,
                                'mutable-content' => 1
                            ],
                            'type' => 'ios_call',
                            'callType' => 'voice',
                            'callerId' => 'debug_caller',
                            'callerName' => $testCallerName,
                            'callId' => $testCallId,
                            'triggerCallKit' => 'true'
                        ]
                    ]);

                $result = $firebase->send($message);
                $sentCount++;
                Log::info('🧪 [DEBUG] FCM sent successfully', ['result' => $result]);
                
            } catch (Exception $e) {
                $error = $e->getMessage();
                $errors[] = $error;
                Log::error('🧪 [DEBUG] FCM send failed', ['error' => $error]);
            }
        }
        
        return response()->json([
            'success' => $sentCount > 0,
            'step' => 'fcm_send',
            'message' => $sentCount > 0 ? 'FCM notifications sent successfully' : 'All FCM sends failed',
            'debug' => [
                'sent_count' => $sentCount,
                'total_tokens' => $iosTokens->count(),
                'errors' => $errors,
                'test_data' => [
                    'caller_name' => $testCallerName,
                    'call_id' => $testCallId
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        Log::error('🧪 [DEBUG] Test failed', ['error' => $e->getMessage()]);
        return response()->json([
            'success' => false,
            'step' => 'general_error',
            'message' => 'Test failed: ' . $e->getMessage(),
            'error' => $e->getMessage()
        ]);
    }
});

// Quick test notification route
Route::get('/api/test-notification', function() {
    try {
        $firebaseConfigPath = base_path('firebase-credentials.json');
        
        if (!file_exists($firebaseConfigPath)) {
            return response()->json(['error' => 'Firebase credentials not found'], 500);
        }
        
        $firebase = (new \Kreait\Firebase\Factory)
            ->withServiceAccount($firebaseConfigPath)
            ->createMessaging();
        
        $subscriptions = \App\Models\PushSubscription::where('content_encoding', 'fcm')->get();
        
        if ($subscriptions->count() === 0) {
            return response()->json(['error' => 'No FCM tokens found'], 404);
        }
        
        $sentCount = 0;
        foreach ($subscriptions as $sub) {
            try {
                $message = \Kreait\Firebase\Messaging\CloudMessage::withTarget('token', $sub->endpoint)
                    ->withNotification(\Kreait\Firebase\Messaging\Notification::create(
                        'iOS Test Notification',
                        'This is a background notification test from your workflow app! 🎉'
                    ))
                    ->withData([
                        'type' => 'test',
                        'timestamp' => time()
                    ]);
                    
                $result = $firebase->send($message);
                $sentCount++;
            } catch (Exception $e) {
                \Log::error('FCM send error: ' . $e->getMessage());
            }
        }
        
        return response()->json([
            'success' => true,
            'sent' => $sentCount,
            'total_tokens' => $subscriptions->count()
        ]);
        
    } catch (Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Wrapped all API routes in the 'api' middleware group
Route::middleware(['api'])->group(function () {
    Route::get('/test-api', function () {
        return response()->json(['message' => 'Backend is running']);
    });

    // Workflow API Routes
    Route::prefix('api/workflows')->group(function () {
        Route::get('/', [WorkflowController::class, 'apiIndex']);
        Route::post('/', [WorkflowController::class, 'store']);
        Route::get('/{workflow}', [WorkflowController::class, 'show']);
        Route::put('/{workflow}', [WorkflowController::class, 'update']);
        Route::delete('/{workflow}', [WorkflowController::class, 'destroy']);
        
        // Canvas-specific endpoints
        Route::post('/{workflow}/canvas', [WorkflowController::class, 'saveCanvas']);
        Route::get('/{workflow}/canvas', [WorkflowController::class, 'loadCanvas']);
    });

    // Trigger API Routes
    Route::prefix('triggers')->group(function () {
        Route::get('/', [TriggerController::class, 'index']);
        Route::get('/{trigger}', [TriggerController::class, 'show']);
    });

    // Action API Routes
    Route::prefix('actions')->group(function () {
        Route::get('/', [ActionController::class, 'index']);
        Route::get('/{action}', [ActionController::class, 'show']);
    });

    // Call API routes - simplified since we only need basic call handling
    Route::prefix('api/calls')->group(function () {
        Route::post('/initiate', function (Request $request) {
            $validated = $request->validate([
                'phone_number' => 'required|string',
                'is_video' => 'boolean',
            ]);
            
            $callId = 'call_' . uniqid();
            
            return response()->json([
                'success' => true,
                'message' => 'Call initiated successfully',
                'call_id' => $callId,
                'details' => [
                    'phone_number' => $validated['phone_number'],
                    'type' => ($validated['is_video'] ?? false) ? 'video' : 'voice',
                ]
            ]);
        });
        
        // Basic call status endpoints
        Route::post('/accept', function (Request $request) {
            return response()->json(['success' => true, 'message' => 'Call accepted']);
        });
        
        Route::post('/reject', function (Request $request) {
            return response()->json(['success' => true, 'message' => 'Call rejected']);
        });
        
        Route::post('/end', function (Request $request) {
            return response()->json(['success' => true, 'message' => 'Call ended']);
        });
        
        Route::get('/{callId}/status', function ($callId) {
            return response()->json(['call_id' => $callId, 'status' => 'active']);
        });
    });

    // API route for initiating calls - Now using closure
    Route::post('/api/initiate-call', function (Request $request) {
        $validated = $request->validate([
            'phone_number' => 'required|string',
            'is_video' => 'boolean',
        ]);
        
        $callId = 'call_' . uniqid();
        
        return response()->json([
            'success' => true,
            'message' => 'Call initiated successfully',
            'call_id' => $callId,
            'details' => [
                'phone_number' => $validated['phone_number'],
                'type' => ($validated['is_video'] ?? false) ? 'video' : 'voice',
            ]
        ]);
    });
});

// Workflow broadcast route for device connections
Route::post('/api/workflow/{workflowId}/broadcast', function (Request $request, $workflowId) {
    $validated = $request->validate([
        'message' => 'required|string',
        'type' => 'required|string|in:connect,disconnect,message',
        'connectionId' => 'required|string',
        'browser' => 'nullable|string'
    ]);
    
    // Broadcast the event to all connected devices on this workflow
    broadcast(new WorkflowEvent(
        $workflowId,
        $validated['type'],
        $validated['message'],
        $validated['connectionId'],
        $validated['browser'] ?? null
    ));
    
    return response()->json([
        'success' => true,
        'message' => 'Event broadcasted successfully'
    ]);
});

// Test broadcasting route
Route::get('/test-broadcast', function () {
    broadcast(new TestBroadcast('Broadcasting test from Laravel Reverb!'));
    
    return response()->json([
        'success' => true,
        'message' => 'Broadcast event sent successfully!'
    ]);
});

// Get reverb status
Route::get('/reverb-status', function () {
    return response()->json([
        'reverb_config' => [
            'app_id' => config('broadcasting.connections.reverb.app_id'),
            'host' => config('broadcasting.connections.reverb.options.host'),
            'port' => config('broadcasting.connections.reverb.options.port'),
            'scheme' => config('broadcasting.connections.reverb.options.scheme'),
        ],
        'broadcast_driver' => config('broadcasting.default'),
        'timestamp' => now()->toISOString()
    ]);
});

// User route with auth middleware
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// New fallback route to handle Electron app routing
Route::get('/call', function (Request $request) {
    // This route serves the call screen for Electron
    return view('call', [
        'callData' => $request->all()
    ]);
});

// Desktop call route
Route::post('/api/workflow/{workflowId}/desktop-call', function (Request $request, $workflowId) {
    $validated = $request->validate([
        'targetDevices' => 'required|string',
        'callerName' => 'required|string|max:255',
        'callType' => 'required|string|in:voice,video',
        'callId' => 'required|string|max:100',
        'timestamp' => 'required|string'
    ]);
    
    // Broadcast the desktop call event to all connected devices on this workflow
    broadcast(new DesktopCallEvent(
        $workflowId,
        $validated,
        $request->header('X-Connection-Id', 'unknown'),
        $validated['callerName']
    ));
    
    return response()->json([
        'success' => true,
        'message' => 'Desktop call broadcasted successfully',
        'data' => [
            'workflowId' => $workflowId,
            'callId' => $validated['callId'],
            'callType' => $validated['callType'],
            'callerName' => $validated['callerName'],
            'timestamp' => $validated['timestamp'],
        ]
    ]);
});