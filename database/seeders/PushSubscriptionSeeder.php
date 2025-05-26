<?php

namespace Database\Seeders;

use App\Models\PushSubscription;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class PushSubscriptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test web push subscription
        PushSubscription::create([
            'endpoint' => 'https://test-endpoint-for-push-notifications.example.com/test-endpoint-' . uniqid(),
            'public_key' => 'BDd3_hVL9ddlSs9DfmR7HS1CJB2UapUXmBj3bo6WOvz5T5R9phjJiY_EBwnAQkE4Emo54tgIg-tz89gyn2yiX5E',
            'auth_token' => 'test-auth-token-' . uniqid(),
            'content_encoding' => 'aes128gcm',
            'user_id' => 1 // Assuming there's a user with ID 1, default for testing
        ]);
        
        // Create a test FCM subscription (for mobile testing)
        PushSubscription::create([
            'endpoint' => 'test-fcm-token-' . uniqid(),
            'content_encoding' => 'fcm',
            'device_id' => 'test-device-' . uniqid(),
            'platform' => 'android',
            'user_id' => 1 // Assuming there's a user with ID 1, default for testing
        ]);
    }
}
