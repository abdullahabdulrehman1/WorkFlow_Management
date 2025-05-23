<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\PushSubscription;

class WebPushService
{
    protected $baseUrl;

    public function __construct()
    {
        // Get the URL from config or use default
        $this->baseUrl = config('services.webpush_service.url', 'http://localhost:3001');
    }

    /**
     * Get VAPID public key from the service
     * 
     * @return string|null
     */
    public function getVapidPublicKey()
    {
        try {
            $response = Http::get("{$this->baseUrl}/vapid-public-key");
            
            if ($response->successful()) {
                return $response->json('vapidPublicKey');
            }
            
            Log::error('Failed to get VAPID public key', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            return null;
        } catch (Exception $e) {
            Log::error('Exception getting VAPID public key', [
                'message' => $e->getMessage()
            ]);
            
            return null;
        }
    }

    /**
     * Send a push notification to a single subscription
     * 
     * @param array $subscription
     * @param array $payload
     * @return bool
     */
    public function sendNotification($subscription, $payload)
    {
        try {
            // First check if the service is available
            try {
                $healthCheck = Http::timeout(2)->get("{$this->baseUrl}");
                if (!$healthCheck->successful()) {
                    Log::warning('Web push service not responding properly', [
                        'status' => $healthCheck->status(),
                        'body' => $healthCheck->body()
                    ]);
                    
                    // Try to use the direct trigger endpoint instead
                    $triggerResponse = Http::timeout(2)->get("{$this->baseUrl}/trigger", [
                        'title' => $payload['title'] ?? 'Notification',
                        'body' => $payload['body'] ?? 'You have a new notification'
                    ]);
                    
                    if ($triggerResponse->successful()) {
                        Log::info('Notification sent via trigger endpoint');
                        return true;
                    }
                    
                    Log::warning('Trigger endpoint failed too');
                }
            } catch (\Exception $e) {
                Log::warning('Web push service health check failed: ' . $e->getMessage());
                
                // If web push service is unavailable, return a graceful failure
                return [
                    'success' => false,
                    'message' => 'Web push service unavailable',
                    'error' => $e->getMessage()
                ];
            }

            // Proceed with normal flow if service is available
            $response = Http::timeout(5)->post("{$this->baseUrl}/send", [
                'subscription' => $subscription,
                'payload' => $payload
            ]);
            
            if ($response->successful()) {
                return true;
            }
            
            Log::error('Failed to send push notification', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            return false;
        } catch (\Exception $e) {
            Log::error('Exception sending push notification', [
                'message' => $e->getMessage()
            ]);
            
            return false;
        }
    }

    /**
     * Send a push notification to multiple subscriptions
     * 
     * @param array $subscriptions
     * @param array $payload
     * @return array Result with success and failure counts
     */
    public function sendBulkNotifications($subscriptions, $payload)
    {
        try {
            $response = Http::post("{$this->baseUrl}/send-bulk", [
                'subscriptions' => $subscriptions,
                'payload' => $payload
            ]);
            
            if ($response->successful()) {
                return $response->json();
            }
            
            Log::error('Failed to send bulk push notifications', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            return [
                'success' => false,
                'results' => [
                    'success' => [],
                    'failed' => array_map(function($sub) {
                        return ['endpoint' => $sub['endpoint'] ?? 'unknown'];
                    }, $subscriptions)
                ]
            ];
        } catch (Exception $e) {
            Log::error('Exception sending bulk push notifications', [
                'message' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Send a notification to all of a user's subscriptions
     * 
     * @param \App\Models\User $user
     * @param array $payload
     * @return array
     */
    public function notifyUser($user, $payload)
    {
        $subscriptions = $user->pushSubscriptions()->get()->map(function($sub) {
            return [
                'endpoint' => $sub->endpoint,
                'keys' => [
                    'p256dh' => $sub->public_key,
                    'auth' => $sub->auth_token,
                ],
            ];
        })->toArray();
        
        if (empty($subscriptions)) {
            return [
                'success' => false,
                'message' => 'No subscriptions found for user',
            ];
        }
        
        return $this->sendBulkNotifications($subscriptions, $payload);
    }
}