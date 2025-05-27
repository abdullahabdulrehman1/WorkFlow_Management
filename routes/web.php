<?php
use App\Http\Controllers\ActionController;
use App\Http\Controllers\PushNotificationController;
use App\Http\Controllers\TriggerController;
use App\Http\Controllers\WorkflowController;
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

// User route with auth middleware
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});