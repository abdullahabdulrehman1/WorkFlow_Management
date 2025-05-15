<?php
require __DIR__ . '/vendor/autoload.php';

use Minishlink\WebPush\VAPID;

try {
    echo "Generating VAPID keys...\n";
    $vapidKeys = VAPID::createVapidKeys();
    
    echo "VAPID keys generated successfully!\n";
    echo "Public key: " . $vapidKeys['publicKey'] . "\n";
    echo "Private key: " . $vapidKeys['privateKey'] . "\n";
    
    echo "\nAdd these keys to your .env file:\n";
    echo "VAPID_PUBLIC_KEY=" . $vapidKeys['publicKey'] . "\n";
    echo "VAPID_PRIVATE_KEY=" . $vapidKeys['privateKey'] . "\n";
} catch (Exception $e) {
    echo "Error generating VAPID keys: " . $e->getMessage() . "\n";

    // Alternative method if the first one fails
    echo "\nTrying alternative method...\n";
    try {
        // Create a key pair using OpenSSL directly
        $res = openssl_pkey_new([
            'curve_name' => 'prime256v1',
            'private_key_type' => OPENSSL_KEYTYPE_EC,
        ]);

        if ($res === false) {
            throw new Exception("Failed to create key pair: " . openssl_error_string());
        }

        // Export the private key
        openssl_pkey_export($res, $privateKey);
        
        // Extract the public key
        $details = openssl_pkey_get_details($res);
        $publicKey = $details['key'];

        echo "Keys generated using alternative method:\n";
        echo "Public key: " . base64_encode($publicKey) . "\n";
        echo "Private key: " . base64_encode($privateKey) . "\n";
        
        echo "\nAdd these keys to your .env file:\n";
        echo "VAPID_PUBLIC_KEY=" . base64_encode($publicKey) . "\n";
        echo "VAPID_PRIVATE_KEY=" . base64_encode($privateKey) . "\n";
    } catch (Exception $e2) {
        echo "Alternative method also failed: " . $e2->getMessage() . "\n";
    }
}