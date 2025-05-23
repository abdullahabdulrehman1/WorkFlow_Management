<?php
use App\Http\Controllers\ActionController;
// use App\Http\Controllers\PushNotificationController; // Commented out to avoid reference to deleted controller
use App\Http\Controllers\TriggerController;
use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\WebPushController;
use App\Http\Controllers\PushSubscriptionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

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

// Call decision screen route (new)
Route::get('/call-decision/{callId}', function (Request $request, $callId) {
    return Inertia::render('CallDecision', [
        'callId' => $callId,
        'callType' => $request->query('type', 'audio'),
        'recipientId' => $request->query('recipient'),
        'callerName' => $request->query('caller')
    ]);
});

// Call test route
Route::get('/call-test', function () {
    return Inertia::render('CallTest');
})->name('call.test');

// Test notification page route
Route::get('/notification-test', function () {
    return Inertia::render('NotificationTest');
})->name('notification.test');

// Push Notification Routes - Using NEW WebPushController
Route::middleware(['web'])->group(function () {
    // VAPID key retrieval
    Route::get('/vapid-public-key', [WebPushController::class, 'getVapidPublicKey'])
        ->name('vapid.public.key');
    
    // Subscription management
    Route::post('/push-subscriptions', [WebPushController::class, 'storeSubscription'])
        ->name('push.store');
    Route::delete('/push-subscriptions', [WebPushController::class, 'deleteSubscription'])
        ->name('push.delete');
    Route::get('/api/user-subscriptions', [WebPushController::class, 'getUserSubscriptions'])
        ->name('notifications.subscriptions');
    
    // Push notification endpoints
    Route::post('/api/push-notify', [WebPushController::class, 'sendNotification'])
        ->name('push.notify');
    Route::post('/api/test-push', [WebPushController::class, 'sendTestNotification'])
        ->name('notifications.test');
    
    // IMPORTANT: Keeping these routes commented out to avoid conflicts
    // Route::post('/api/subscribe', [PushNotificationController::class, 'subscribe']);
    // Route::post('/api/push-notify', [PushNotificationController::class, 'sendTestPush']);
});

// Adding a direct GET route for test notifications
Route::get('/test-notification', function (App\Services\WebPushService $webPushService) {
    try {
        Log::debug('Starting test notification via direct GET route');
        
        // Get user from auth if available, or use fallback methods
        $user = Auth::user();
        
        if (!$user) {
            // No authentication required - use the first user with subscriptions
            $subscription = App\Models\PushSubscription::first();
            if ($subscription && $subscription->user_id) {
                $user = App\Models\User::find($subscription->user_id);
            }
            
            // If still no user, get the first user in the system
            if (!$user) {
                $user = App\Models\User::first();
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
            'url' => '/notification-test'
        ];
        
        // Directly use our WebPushService
        $result = $webPushService->notifyUser($user, $payload);
        
        return response()->json([
            'sent' => $result['success'] ?? false,
            'message' => 'Test notification sent through direct GET route',
            'results' => $result
        ]);
    } catch (\Exception $e) {
        Log::error('Test notification failed: ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ]);
        
        return response()->json([
            'sent' => false,
            'error' => 'Test notification failed: ' . $e->getMessage()
        ], 500);
    }
})->name('test.notification.get');

// Debug route to check authentication status
Route::get('/auth-check', function() {
    if (Auth::check()) {
        return response()->json([
            'authenticated' => true,
            'user' => Auth::user()
        ]);
    } else {
        return response()->json([
            'authenticated' => false,
            'message' => 'User is not authenticated'
        ]);
    }
})->name('auth.check');

// New push notification route that directly invokes the Node.js service
Route::post('/api/push-notify-direct', function(App\Services\WebPushService $webPushService, Illuminate\Http\Request $request) {
    try {
        Log::debug('Starting direct push notification via Node.js');
        
        // Get user from auth if available, or use fallback methods
        $user = Auth::user();
        
        if (!$user) {
            // No authentication required - use the first user with subscriptions
            $subscription = App\Models\PushSubscription::first();
            if ($subscription && $subscription->user_id) {
                $user = App\Models\User::find($subscription->user_id);
            }
            
            // If still no user, get the first user in the system
            if (!$user) {
                $user = App\Models\User::first();
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
        ];
        
        // Check if we have any subscriptions
        $subscriptions = App\Models\PushSubscription::where('user_id', $user->id)->get()->map(function($sub) {
            return [
                'endpoint' => $sub->endpoint,
                'keys' => [
                    'p256dh' => $sub->public_key,
                    'auth' => $sub->auth_token,
                ],
            ];
        })->toArray();
        
        if (empty($subscriptions)) {
            // If no subscriptions exist, return a success message anyway to avoid disrupting the workflow
            Log::info('No push subscriptions found for user', ['user_id' => $user->id]);
            return response()->json([
                'sent' => false,
                'message' => 'No push subscriptions found for this user',
                'skipNotification' => true  // Add flag to indicate notification was skipped
            ]);
        }
        
        try {
            // Attempt to send through web push service
            $result = $webPushService->sendBulkNotifications($subscriptions, $payload);
            
            return response()->json([
                'sent' => $result['success'] ?? false,
                'message' => 'Notification request processed',
                'results' => $result
            ]);
        } catch (\Exception $e) {
            // Handle failure gracefully with detailed error
            Log::error('Push service error', [
                'message' => $e->getMessage(),
                'type' => get_class($e)
            ]);
            
            // Return a non-error response to avoid disrupting the workflow
            return response()->json([
                'sent' => false,
                'message' => 'Push notification service unavailable',
                'error' => $e->getMessage(),
                'skipNotification' => true
            ]);
        }
    } catch (\Exception $e) {
        Log::error('Push notification error: ' . $e->getMessage(), [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
        
        // Return a non-500 response to avoid disrupting the workflow
        return response()->json([
            'sent' => false,
            'error' => 'Push notification failed: ' . $e->getMessage(),
            'skipNotification' => true
        ]);
    }
})->name('push.notify.direct');

// IMPORTANT: Commenting out old problematic routes that use PushNotificationController
// Route::post('/api/subscribe', [PushNotificationController::class, 'subscribe'])
//    ->name('notifications.subscribe');
// Route::post('/api/push-notify', [PushNotificationController::class, 'send'])
//    ->name('notifications.send');
// Route::get('/api/user-subscriptions', [PushNotificationController::class, 'getUserSubscriptions'])
//    ->name('notifications.subscriptions');
// Route::post('/api/test-push', [PushNotificationController::class, 'sendTestPush'])
//    ->name('notifications.test');
// Route::get('/vapid-public-key', [PushSubscriptionController::class, 'getVapidPublicKey']);
// Route::post('/push-subscriptions', [PushSubscriptionController::class, 'store']);
// Route::delete('/push-subscriptions', [PushSubscriptionController::class, 'destroy']);

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

    // Call API routes
    Route::prefix('api/calls')->group(function () {
        Route::post('/initiate', [App\Http\Controllers\CallController::class, 'initiate']);
        Route::post('/accept', [App\Http\Controllers\CallController::class, 'accept']);
        Route::post('/reject', [App\Http\Controllers\CallController::class, 'reject']);
        Route::post('/end', [App\Http\Controllers\CallController::class, 'end']);
        Route::get('/{callId}/status', [App\Http\Controllers\CallController::class, 'status']);
    });

    // FCM routes for token registration
    Route::post('/api/fcm/register', [App\Http\Controllers\FCMController::class, 'register']);
});

// User route without auth middleware since we don't need authentication
Route::get('/user', function (Request $request) {
    return $request->user();
});