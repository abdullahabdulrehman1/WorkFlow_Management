<?php

namespace App\Http\Controllers;

use App\Events\WorkflowEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeviceConnectionController extends Controller
{
    /**
     * Handle device connection and broadcast to other devices
     */
    public function connect(Request $request, $workflowId)
    {
        $validated = $request->validate([
            'deviceName' => 'required|string|max:255',
            'browser' => 'required|string|max:500',
            'connectionId' => 'required|string|max:100',
        ]);

        // Log the connection for debugging
        Log::info('Device connecting to workflow', [
            'workflow_id' => $workflowId,
            'device_name' => $validated['deviceName'],
            'connection_id' => $validated['connectionId'],
            'ip_address' => $request->ip(),
            'user_agent' => $request->header('User-Agent'),
        ]);

        // Broadcast connection event to all other devices
        broadcast(new WorkflowEvent(
            $workflowId,
            'connect',
            "New device connected: {$validated['deviceName']}",
            $validated['connectionId'],
            $validated['browser']
        ));

        return response()->json([
            'success' => true,
            'message' => 'Device connection broadcasted successfully',
            'data' => [
                'workflowId' => $workflowId,
                'deviceName' => $validated['deviceName'],
                'connectionId' => $validated['connectionId'],
                'timestamp' => now()->toISOString(),
            ]
        ]);
    }

    /**
     * Handle device disconnection and broadcast to other devices
     */
    public function disconnect(Request $request, $workflowId)
    {
        $validated = $request->validate([
            'deviceName' => 'required|string|max:255',
            'browser' => 'required|string|max:500',
            'connectionId' => 'required|string|max:100',
        ]);

        // Log the disconnection for debugging
        Log::info('Device disconnecting from workflow', [
            'workflow_id' => $workflowId,
            'device_name' => $validated['deviceName'],
            'connection_id' => $validated['connectionId'],
            'ip_address' => $request->ip(),
        ]);

        // Broadcast disconnection event to all other devices
        broadcast(new WorkflowEvent(
            $workflowId,
            'disconnect',
            "Device disconnected: {$validated['deviceName']}",
            $validated['connectionId'],
            $validated['browser']
        ));

        return response()->json([
            'success' => true,
            'message' => 'Device disconnection broadcasted successfully',
            'data' => [
                'workflowId' => $workflowId,
                'deviceName' => $validated['deviceName'],
                'connectionId' => $validated['connectionId'],
                'timestamp' => now()->toISOString(),
            ]
        ]);
    }

    /**
     * Send a custom message to all connected devices
     */
    public function sendMessage(Request $request, $workflowId)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:500',
            'deviceName' => 'required|string|max:255',
            'connectionId' => 'required|string|max:100',
            'type' => 'sometimes|string|in:info,success,warning,error',
        ]);

        $messageType = $validated['type'] ?? 'info';
        $deviceName = $validated['deviceName'];
        $fullMessage = "📢 {$deviceName}: {$validated['message']}";

        // Log the message for debugging
        Log::info('Broadcasting message to workflow devices', [
            'workflow_id' => $workflowId,
            'message' => $validated['message'],
            'sender_device' => $deviceName,
            'connection_id' => $validated['connectionId'],
            'type' => $messageType,
        ]);

        // Broadcast message to all devices
        broadcast(new WorkflowEvent(
            $workflowId,
            'message',
            $fullMessage,
            $validated['connectionId'],
            $request->header('User-Agent')
        ));

        return response()->json([
            'success' => true,
            'message' => 'Message broadcasted successfully',
            'data' => [
                'workflowId' => $workflowId,
                'originalMessage' => $validated['message'],
                'broadcastMessage' => $fullMessage,
                'senderDevice' => $deviceName,
                'connectionId' => $validated['connectionId'],
                'timestamp' => now()->toISOString(),
            ]
        ]);
    }

    /**
     * Get workflow connection statistics
     */
    public function getConnectionStats($workflowId)
    {
        // Since we don't store persistent connection data, 
        // this is mainly for debugging and monitoring
        return response()->json([
            'workflowId' => $workflowId,
            'timestamp' => now()->toISOString(),
            'status' => 'active',
            'note' => 'Real-time connection tracking via Laravel Reverb WebSocket'
        ]);
    }
}