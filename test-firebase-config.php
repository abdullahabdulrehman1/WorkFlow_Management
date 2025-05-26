<?php
/**
 * Test script to verify Firebase configuration and connectivity
 * 
 * This script will:
 * 1. Check if the firebase-credentials.json file exists
 * 2. Verify the credentials are valid
 * 3. Send a test notification to all registered FCM tokens
 * 
 * Run this script from the command line:
 * php test-firebase-config.php
 */

// Load Composer autoloader
require __DIR__ . '/vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FirebaseNotification;

// Function to print status messages with colors
function printStatus($message, $status = 'info') {
    $colors = [
        'success' => "\033[0;32m", // Green
        'error' => "\033[0;31m",   // Red
        'info' => "\033[0;34m",    // Blue
        'warning' => "\033[0;33m",  // Yellow
        'reset' => "\033[0m"       // Reset
    ];
    
    echo $colors[$status] . $message . $colors['reset'] . PHP_EOL;
}

// Start testing
printStatus("🔍 FIREBASE CONFIGURATION TEST", 'info');
printStatus("==============================", 'info');

// Check if firebase-credentials.json exists
$firebaseConfigPath = __DIR__ . '/firebase-credentials.json';
if (file_exists($firebaseConfigPath)) {
    printStatus("✅ Firebase credentials file exists at: " . $firebaseConfigPath, 'success');
} else {
    printStatus("❌ Firebase credentials file doesn't exist at: " . $firebaseConfigPath, 'error');
    exit(1);
}

// Check if file is readable
if (is_readable($firebaseConfigPath)) {
    printStatus("✅ Firebase credentials file is readable", 'success');
} else {
    printStatus("❌ Firebase credentials file is not readable", 'error');
    exit(1);
}

// Check if file contains valid JSON
try {
    $fileContents = file_get_contents($firebaseConfigPath);
    $json = json_decode($fileContents);
    
    if (json_last_error() === JSON_ERROR_NONE) {
        printStatus("✅ Firebase credentials file contains valid JSON", 'success');
    } else {
        printStatus("❌ Firebase credentials file contains invalid JSON: " . json_last_error_msg(), 'error');
        exit(1);
    }
} catch (Exception $e) {
    printStatus("❌ Error reading Firebase credentials: " . $e->getMessage(), 'error');
    exit(1);
}

// Check for required fields in credentials
$requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
$missingFields = [];

foreach ($requiredFields as $field) {
    if (!property_exists($json, $field)) {
        $missingFields[] = $field;
    }
}

if (count($missingFields) > 0) {
    printStatus("❌ Firebase credentials is missing required fields: " . implode(', ', $missingFields), 'error');
    exit(1);
} else {
    printStatus("✅ Firebase credentials contain all required fields", 'success');
    printStatus("   Project ID: " . $json->project_id, 'info');
}

// Attempt to initialize Firebase
try {
    printStatus("🔄 Initializing Firebase...", 'info');
    
    $firebase = (new Factory)
        ->withServiceAccount($firebaseConfigPath)
        ->createMessaging();
    
    printStatus("✅ Successfully initialized Firebase Messaging", 'success');
} catch (Exception $e) {
    printStatus("❌ Failed to initialize Firebase: " . $e->getMessage(), 'error');
    exit(1);
}

// Load FCM tokens from database if available
try {
    // This part requires Laravel's database connection
    // Since we're running from command line, we need to bootstrap Laravel
    if (file_exists(__DIR__ . '/bootstrap/app.php')) {
        $app = require_once __DIR__ . '/bootstrap/app.php';
        $app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
        
        // Now we can use Laravel's database
        if (class_exists('\App\Models\PushSubscription')) {
            $subscriptions = \App\Models\PushSubscription::where('content_encoding', 'fcm')->get();
            
            if ($subscriptions->count() > 0) {
                printStatus("✅ Found " . $subscriptions->count() . " FCM tokens in database", 'success');
                
                // Ask if user wants to send test notifications
                echo "Do you want to send test notifications to these devices? (y/n): ";
                $answer = trim(fgets(STDIN));
                
                if (strtolower($answer) === 'y' || strtolower($answer) === 'yes') {
                    $sentCount = 0;
                    $failedCount = 0;
                    
                    foreach ($subscriptions as $sub) {
                        try {
                            // Create a test message
                            $message = CloudMessage::withTarget('token', $sub->endpoint)
                                ->withNotification(FirebaseNotification::create(
                                    'Firebase Test',
                                    'This is a test notification from the workflow system'
                                ))
                                ->withData([
                                    'type' => 'test',
                                    'timestamp' => time()
                                ]);
                                
                            // Send the message
                            $result = $firebase->send($message);
                            $sentCount++;
                            
                            printStatus("✅ Sent test message to token: " . substr($sub->endpoint, 0, 10) . "...", 'success');
                        } catch (Exception $e) {
                            $failedCount++;
                            printStatus("❌ Failed to send to token " . substr($sub->endpoint, 0, 10) . "...: " . $e->getMessage(), 'error');
                        }
                    }
                    
                    printStatus("📊 Test Summary: " . $sentCount . " sent, " . $failedCount . " failed", $sentCount > 0 ? 'success' : 'warning');
                }
            } else {
                printStatus("⚠️ No FCM tokens found in database", 'warning');
                printStatus("   You need to register FCM tokens from your mobile devices first", 'info');
            }
        } else {
            printStatus("⚠️ PushSubscription model not found", 'warning');
        }
    } else {
        printStatus("⚠️ Couldn't access Laravel bootstrap", 'warning');
        printStatus("   Skipping database checks", 'info');
    }
} catch (Exception $e) {
    printStatus("⚠️ Error accessing database: " . $e->getMessage(), 'warning');
    printStatus("   Skipping database checks", 'info');
}

// Final status
printStatus("✅ Firebase configuration looks good!", 'success');
printStatus("You can now use FCM to send call notifications to Android devices.", 'info');