<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationController extends Controller
{
    /**
     * Store a new push notification subscription.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function subscribe(Request $request)
    {
        PushSubscription::updateOrCreate(
            ['endpoint' => $request->endpoint],
            $request->only('endpoint', 'public_key', 'auth_token')
        );

        return response()->json(['success' => true]);
    }

    /**
     * Send a test push notification to all subscribed devices.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function sendTestPush(Request $request)
    {
        try {
            $subscriptions = PushSubscription::all();
            
            if ($subscriptions->isEmpty()) {
                return response()->json([
                    'sent' => false,
                    'message' => 'No subscriptions found'
                ], 404);
            }
            
            // Set TTL to 0 for immediate delivery
            $auth = [
                'VAPID' => [
                    'subject' => config('webpush.vapid.subject'), 
                    'publicKey' => config('webpush.vapid.public_key'),
                    'privateKey' => config('webpush.vapid.private_key'),
                ],
                'ttl' => 0,
            ];
            
            $webPush = new WebPush($auth);
            $sentCount = 0;
            $failedCount = 0;
            $results = [];
            
            foreach ($subscriptions as $sub) {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'publicKey' => $sub->public_key,
                    'authToken' => $sub->auth_token,
                    'contentEncoding' => $sub->content_encoding ?? 'aesgcm'
                ]);

                $payload = json_encode([
                    'title' => $request->title,
                    'body' => $request->body,
                    'timestamp' => time()
                ]);

                $webPush->queueNotification($subscription, $payload);
            }
            
            // Send notifications and collect results
            foreach ($webPush->flush() as $report) {
                $endpoint = $report->getRequest()->getUri()->__toString();
                
                if ($report->isSuccess()) {
                    $sentCount++;
                    $results[] = [
                        'endpoint' => $endpoint,
                        'status' => 'success',
                        'message' => 'Notification sent'
                    ];
                } else {
                    $failedCount++;
                    $results[] = [
                        'endpoint' => $endpoint,
                        'status' => 'failed',
                        'message' => $report->getReason(),
                        'statusCode' => $report->getStatusCode()
                    ];
                    
                    // If invalid subscription, remove it
                    if ($report->getStatusCode() === 410) {
                        PushSubscription::where('endpoint', $endpoint)->delete();
                    }
                }
            }
            
            return response()->json([
                'sent' => $sentCount > 0,
                'stats' => [
                    'total' => $subscriptions->count(),
                    'sent' => $sentCount,
                    'failed' => $failedCount
                ],
                'results' => $results
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'sent' => false,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ], 500);
        }
    }
}
