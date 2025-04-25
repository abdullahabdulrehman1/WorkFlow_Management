<?php

/*
use App\Http\Controllers\ActionController;
use App\Http\Controllers\TriggerController;
use App\Http\Controllers\WorkflowController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|


// Simple test route
Route::get('/test', function () {
    return response()->json(['message' => 'API is working!']);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Workflow API Routes
Route::prefix('workflows')->group(function () {
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
    // Route::get('/{trigger}', [TriggerController::class, 'show']);
});

// Action API Routes
Route::prefix('actions')->group(function () {
    Route::get('/', [ActionController::class, 'index']);
    Route::get('/{action}', [ActionController::class, 'show']);
});*/