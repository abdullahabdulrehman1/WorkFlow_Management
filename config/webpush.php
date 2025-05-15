<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID Authentication
    |--------------------------------------------------------------------------
    |
    | You'll need to create a public/private key pair to use for VAPID
    | authentication. You can use the webpush:vapid command to generate
    | the keys, or you can use another tool of your choice.
    |
    */

    'vapid' => [
        'subject' => env('VAPID_SUBJECT', 'mailto:'.env('MAIL_FROM_ADDRESS')),
        'public_key' => env('VAPID_PUBLIC_KEY'),
        'private_key' => env('VAPID_PRIVATE_KEY'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Database Model
    |--------------------------------------------------------------------------
    |
    | Configure the model that will be used to store push subscriptions.
    | Typically you'd want to associate this with your User model,
    | but it could also be a separate model entirely.
    |
    */

    'model' => [
        'subscription' => \App\Models\PushSubscription::class,
        'user' => \App\Models\User::class,
    ],

    /*
    |--------------------------------------------------------------------------
    | TTL (Time to Live)
    |--------------------------------------------------------------------------
    |
    | Time in seconds that a push message can be delivered.
    | Default is 2419200 (4 weeks).
    |
    */

    'ttl' => 2419200,

    /*
    |--------------------------------------------------------------------------
    | Automatic Database Pruning
    |--------------------------------------------------------------------------
    |
    | Configure how expired subscriptions should be handled.
    | Setting 'enabled' to true will automatically delete expired
    | subscriptions when a push notification is sent.
    |
    */

    'database_pruning' => [
        'enabled' => true,
        'limit' => 1000,
    ],
];