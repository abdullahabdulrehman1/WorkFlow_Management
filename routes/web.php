<?php
use App\Http\Controllers\ActionController;
use App\Http\Controllers\PushNotificationController;
use App\Http\Controllers\TriggerController;
use App\Http\Controllers\WorkflowController;
use App\Events\TestBroadcast;
use App\Events\WorkflowEvent;
use App\Events\DesktopCallEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


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