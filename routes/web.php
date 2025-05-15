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

// Push Notification Routes - Using web middleware with CSRF protection
Route::middleware(['web'])->group(function () {
    Route::post('/api/subscribe', [PushNotificationController::class, 'subscribe']);
    Route::post('/api/push-notify', [PushNotificationController::class, 'sendTestPush']);
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
});

// User route with auth middleware
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});