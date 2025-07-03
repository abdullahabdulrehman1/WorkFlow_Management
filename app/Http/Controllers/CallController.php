<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\PushNotificationController;
use Illuminate\Support\Facades\Log;
use App\Models\PushSubscription;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

class CallController extends Controller
{
    private $pushNotificationController;

    public function __construct()
    {
        $this->pushNotificationController = new PushNotificationController();
    }

    /**
     * Initiate a call and notify all devices
     */
    public function initiateCall(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'caller_name' => 'required|string|max:255',
            'caller_number' => 'required|string|max:50',
            'action' => 'required|string|in:outgoing_call,desktop_call,incoming_call',
            'platform' => 'required|string|in:ios,android,web',
            'target_device' => 'nullable|string|in:all,mobile,desktop'
        ]);

        try {
            // Log the call initiation
            Log::info('Call initiated', [
                'caller_name' => $validated['caller_name'],
                'caller_number' => $validated['caller_number'],
                'action' => $validated['action'],
                'platform' => $validated['platform'],
                'timestamp' => now()
            ]);

            // Prepare notification data based on action
            $notificationData = $this->prepareNotificationData($validated);

            // Send notifications to appropriate devices
            $notificationResult = $this->sendCallNotifications($notificationData, $validated['target_device'] ?? 'all');

            return response()->json([
                'success' => true,
                'message' => 'Call initiated successfully',
                'call_id' => uniqid('call_'),
                'notifications_sent' => $notificationResult['sent'],
                'total_devices' => $notificationResult['total'],
                'data' => $validated
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to initiate call', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to initiate call',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle call actions (answer, end, hold, etc.)
     */
    public function handleCallAction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'call_id' => 'required|string',
            'action' => 'required|string|in:answer,end,hold,unhold,mute,unmute',
            'caller_name' => 'required|string',
            'caller_number' => 'required|string',
            'platform' => 'required|string'
        ]);

        try {
            Log::info('Call action performed', [
                'call_id' => $validated['call_id'],
                'action' => $validated['action'],
                'platform' => $validated['platform'],
                'timestamp' => now()
            ]);

            // Prepare notification for call action
            $notificationData = [
                'title' => $this->getActionTitle($validated['action'], $validated['caller_name']),
                'body' => $this->getActionBody($validated['action'], $validated['caller_name']),
                'data' => [
                    'type' => 'call_action',
                    'action' => $validated['action'],
                    'call_id' => $validated['call_id'],
                    'caller_name' => $validated['caller_name'],
                    'caller_number' => $validated['caller_number'],
                    'timestamp' => now()->toISOString(),
                    'platform' => $validated['platform']
                ]
            ];

            // Send action notification to all devices
            $notificationResult = $this->sendCallNotifications($notificationData, 'all');

            return response()->json([
                'success' => true,
                'message' => 'Call action processed successfully',
                'action' => $validated['action'],
                'notifications_sent' => $notificationResult['sent'],
                'total_devices' => $notificationResult['total']
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to handle call action', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to handle call action',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get call status
     */
    public function getCallStatus(Request $request): JsonResponse
    {
        $callId = $request->get('call_id');

        // In a real app, you'd fetch this from database
        // For now, return a mock response
        return response()->json([
            'success' => true,
            'call_id' => $callId,
            'status' => 'active', // active, ended, ringing
            'duration' => 120, // seconds
            'participants' => [
                'caller' => 'John Doe',
                'callee' => 'Jane Smith'
            ]
        ]);
    }

    /**
     * Send iOS-specific incoming call notification
     */
    public function sendIOSIncomingCall(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'caller_name' => 'required|string',
            'caller_number' => 'required|string',
            'target_token' => 'nullable|string'
        ]);

        try {
            // Prepare iOS CallKit notification
            $notificationData = [
                'title' => 'Incoming Call',
                'body' => "Call from {$validated['caller_name']}",
                'data' => [
                    'type' => 'ios_incoming_call',
                    'caller_name' => $validated['caller_name'],
                    'caller_number' => $validated['caller_number'],
                    'call_id' => uniqid('ios_call_'),
                    'timestamp' => now()->toISOString(),
                    'action' => 'show_callkit'
                ]
            ];

            // Send to specific token or all iOS devices
            if ($validated['target_token']) {
                $result = $this->pushNotificationController->sendToSpecificToken(
                    $validated['target_token'],
                    $notificationData
                );
            } else {
                $result = $this->sendCallNotifications($notificationData, 'mobile');
            }

            return response()->json([
                'success' => true,
                'message' => 'iOS incoming call notification sent',
                'notifications_sent' => $result['sent'] ?? 1
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send iOS incoming call notification', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send iOS incoming call notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prepare notification data based on call action
     */
    private function prepareNotificationData(array $callData): array
    {
        $callerName = $callData['caller_name'];
        $action = $callData['action'];
        $platform = $callData['platform'];

        switch ($action) {
            case 'outgoing_call':
                $title = "Outgoing Call";
                $body = "Calling {$callerName}...";
                break;
            case 'desktop_call':
                $title = "Desktop Call";
                $body = "Call initiated from desktop to {$callerName}";
                break;
            case 'incoming_call':
                $title = "Incoming Call";
                $body = "Call from {$callerName}";
                break;
            default:
                $title = "Call Notification";
                $body = "Call activity with {$callerName}";
        }

        return [
            'title' => $title,
            'body' => $body,
            'data' => [
                'type' => 'call_notification',
                'action' => $action,
                'caller_name' => $callerName,
                'caller_number' => $callData['caller_number'],
                'platform' => $platform,
                'call_id' => uniqid('call_'),
                'timestamp' => now()->toISOString()
            ]
        ];
    }

    /**
     * Get action title for notifications
     */
    private function getActionTitle(string $action, string $callerName): string
    {
        switch ($action) {
            case 'answer':
                return 'Call Answered';
            case 'end':
                return 'Call Ended';
            case 'hold':
                return 'Call On Hold';
            case 'unhold':
                return 'Call Resumed';
            case 'mute':
                return 'Call Muted';
            case 'unmute':
                return 'Call Unmuted';
            default:
                return 'Call Update';
        }
    }

    /**
     * Get action body for notifications
     */
    private function getActionBody(string $action, string $callerName): string
    {
        switch ($action) {
            case 'answer':
                return "Call with {$callerName} has been answered";
            case 'end':
                return "Call with {$callerName} has ended";
            case 'hold':
                return "Call with {$callerName} is on hold";
            case 'unhold':
                return "Call with {$callerName} has resumed";
            case 'mute':
                return "Call with {$callerName} is muted";
            case 'unmute':
                return "Call with {$callerName} is unmuted";
            default:
                return "Call with {$callerName} has been updated";
        }
    }

    /**
     * Send call notifications to appropriate devices
     */
    private function sendCallNotifications(array $notificationData, string $targetDevice): array
    {
        try {
            // Use existing push notification controller
            $result = $this->pushNotificationController->sendCallNotificationToAll($notificationData);
            
            return [
                'sent' => $result['sent'] ?? 0,
                'total' => $result['total'] ?? 0
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed to send call notifications', [
                'error' => $e->getMessage(),
                'notification_data' => $notificationData
            ]);
            
            return [
                'sent' => 0,
                'total' => 0
            ];
        }
    }

    /**
     * Show the call test interface
     * 
     * @param Request $request
     * @return \Inertia\Response
     */
    public function showCallTest(Request $request)
    {
        $phoneNumber = $request->query('phone');
        $isVideo = filter_var($request->query('video', 'false'), FILTER_VALIDATE_BOOLEAN);
        
        return inertia('CallTest', [
            'phoneNumber' => $phoneNumber,
            'isVideo' => $isVideo,
        ]);
    }
}
