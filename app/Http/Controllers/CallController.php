<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\PushSubscription;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

class CallController extends Controller
{
    /**
     * Initiate a call from the web application
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function initiateCall(Request $request)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'phone_number' => 'required|string',
                'is_video' => 'boolean',
            ]);
            
            $phoneNumber = $validated['phone_number'];
            $isVideo = $validated['is_video'] ?? false;
            
            // Log the call request
            Log::info('Call initiated', [
                'phone_number' => $phoneNumber,
                'type' => $isVideo ? 'video' : 'voice',
            ]);
            
            // In a real implementation, you might integrate with a telephony service here
            // For now, we'll just return success
            
            // Generate a unique call ID
            $callId = 'call_' . uniqid();
            
            return response()->json([
                'success' => true,
                'message' => 'Call initiated successfully',
                'call_id' => $callId,
                'details' => [
                    'phone_number' => $phoneNumber,
                    'type' => $isVideo ? 'video' : 'voice',
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Call initiation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to initiate call: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Send a call notification to all connected Android devices
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function notifyCall(Request $request)
    {
        try {
            // Validate request
            $validated = $request->validate([
                'phone_number' => 'required|string',
                'call_type' => 'required|string|in:call,video_call',
                'caller_name' => 'nullable|string',
                'caller_id' => 'nullable|string',
            ]);
            
            $phoneNumber = $validated['phone_number'];
            $callType = $validated['call_type'];
            $callerName = $validated['caller_name'] ?? 'Unknown Caller';
            $callerId = $validated['caller_id'] ?? 'web_' . uniqid();
            
            // Generate a unique call ID
            $callId = 'call_' . uniqid();
            
            Log::info('Call notification request', [
                'phone_number' => $phoneNumber,
                'call_type' => $callType,
                'caller_name' => $callerName,
                'caller_id' => $callerId,
                'call_id' => $callId
            ]);
            
            // Find all FCM subscriptions
            $subscriptions = PushSubscription::where('content_encoding', 'fcm')->get();
            
            if ($subscriptions->isEmpty()) {
                Log::warning('No FCM tokens found for call notification');
                return response()->json([
                    'success' => false,
                    'message' => 'No devices registered for notifications',
                    'call_id' => $callId
                ]);
            }
            
            Log::info('Found ' . $subscriptions->count() . ' FCM tokens for notification');
            
            // Create Firebase messaging instance
            $firebaseConfigPath = base_path('firebase-credentials.json');
            if (!file_exists($firebaseConfigPath)) {
                Log::error('Firebase credentials not found at: ' . $firebaseConfigPath);
                throw new \Exception('Firebase credentials not found');
            }
            
            $firebase = (new Factory)
                ->withServiceAccount($firebaseConfigPath)
                ->createMessaging();
            
            $sentCount = 0;
            $failedCount = 0;
            $errors = [];
            
            // Send to each device token
            foreach ($subscriptions as $sub) {
                try {
                    // The endpoint field contains the FCM token
                    Log::info("Sending to token: " . substr($sub->endpoint, 0, 10) . '...');
                    
                    // Prepare data payload for call
                    $message = CloudMessage::withTarget('token', $sub->endpoint)
                        ->withNotification(FirebaseNotification::create(
                            'Incoming ' . ($callType === 'video_call' ? 'Video' : 'Voice') . ' Call',
                            'Call from ' . $callerName . ' (' . $phoneNumber . ')'
                        ))
                        ->withData([
                            'type' => $callType,
                            'callerId' => $callerId,
                            'callerName' => $callerName,
                            'phoneNumber' => $phoneNumber,
                            'callId' => $callId,
                            'high_priority' => 'true',
                            'content_available' => 'true',
                            'priority' => 'high'  // Add as data instead of using withHighPriority()
                        ]);

                    $result = $firebase->send($message);
                    $sentCount++;
                    
                    Log::info('FCM message sent successfully', [
                        'result' => $result,
                        'token' => substr($sub->endpoint, 0, 10) . '...'
                    ]);
                } catch (\Exception $e) {
                    $failedCount++;
                    $errorMessage = $e->getMessage();
                    $errors[] = $errorMessage;
                    
                    Log::error('Error sending FCM call notification: ' . $errorMessage, [
                        'token' => substr($sub->endpoint, 0, 10) . '...',
                        'exception' => get_class($e),
                        'trace' => $e->getTraceAsString()
                    ]);
                    
                    // If the token is invalid, remove it
                    if (strpos($errorMessage, 'not valid') !== false || 
                        strpos($errorMessage, 'unregistered') !== false ||
                        strpos($errorMessage, 'invalid') !== false) {
                        
                        Log::info('Removing invalid FCM token: ' . substr($sub->endpoint, 0, 10) . '...');
                        $sub->delete();
                    }
                }
            }
            
            $status = ($sentCount > 0) ? 'success' : 'failure';
            $statusCode = ($sentCount > 0) ? 200 : 500;
            
            // Return response with status and counts
            return response()->json([
                'success' => $sentCount > 0,
                'status' => $status,
                'message' => "Call notification: $sentCount sent, $failedCount failed",
                'sent_count' => $sentCount,
                'failed_count' => $failedCount,
                'call_id' => $callId,
                'errors' => $errors
            ], $statusCode);
            
        } catch (\Exception $e) {
            Log::error('Call notification failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send call notification: ' . $e->getMessage(),
                'error_details' => [
                    'message' => $e->getMessage(),
                    'code' => $e->getCode(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
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
