<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Events\WorkflowEvent;
use App\Http\Controllers\DeviceConnectionController;

// Device connection routes for workflows
Route::prefix('workflow/{workflowId}')->group(function () {
    Route::post('/device/connect', [DeviceConnectionController::class, 'connect']);
    Route::post('/device/disconnect', [DeviceConnectionController::class, 'disconnect']);
    Route::post('/device/message', [DeviceConnectionController::class, 'sendMessage']);
    Route::get('/device/stats', [DeviceConnectionController::class, 'getConnectionStats']);
});

// Legacy broadcast endpoint (keeping for backward compatibility)
Route::post('/workflow/{workflowId}/broadcast', function ($workflowId, Request $request) {
    $validated = $request->validate([
        'message' => 'required|string',
        'type' => 'required|string|in:connect,disconnect,message',
        'connectionId' => 'required|string',
        'browser' => 'nullable|string'
    ]);
    
    // Broadcast the event with correct parameter order
    broadcast(new WorkflowEvent(
        $workflowId,
        $validated['type'],
        $validated['message'],
        $validated['connectionId'],
        $validated['browser'] ?? null
    ));
    
    return response()->json([
        'success' => true,
        'message' => 'Event broadcasted successfully',
        'data' => [
            'workflowId' => $workflowId,
            'type' => $validated['type'],
            'connectionId' => $validated['connectionId']
        ]
    ]);
});