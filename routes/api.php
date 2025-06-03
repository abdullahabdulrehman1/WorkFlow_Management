<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Events\WorkflowEvent;

// 

Route::post('/workflow/{workflowId}/broadcast', function ($workflowId, Request $request) {
    event(new WorkflowEvent(
        $workflowId,
        $request->message,
        $request->type ?? 'message',
        $request->connectionId
    ));
    
    return response()->json(['message' => 'Broadcast sent']);
}); 