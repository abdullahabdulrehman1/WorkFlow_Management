package com.workflow.app;

import android.content.Intent;
import android.util.Log;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.os.PowerManager;

import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFirebaseMsgService";
    private static final int WAKE_LOCK_TIMEOUT = 60000; // 60 seconds

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM token: " + token);
        
        // Send the new token to the server using our token manager
        FCMTokenManager.getInstance(getApplicationContext()).retrieveAndSendToken();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "From: " + remoteMessage.getFrom());
        
        // Acquire wake lock to ensure processing completes
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        PowerManager.WakeLock wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "workflow:fcm_wakelock"
        );
        wakeLock.acquire(WAKE_LOCK_TIMEOUT);
        
        try {
            // Check if message contains data payload
            if (remoteMessage.getData().size() > 0) {
                Map<String, String> data = remoteMessage.getData();
                Log.d(TAG, "Message data payload: " + data);
                
                // Check if this is a call notification
                if (isCallNotification(data)) {
                    handleCallNotification(data);
                    return;
                }
            }
            
            // Check if message contains notification payload
            if (remoteMessage.getNotification() != null) {
                Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
                // Handle regular notifications here if needed
            }
        } finally {
            // Release wake lock
            if (wakeLock.isHeld()) {
                wakeLock.release();
            }
        }
    }
    
    /**
     * Determines if the notification is for an incoming call
     */
    private boolean isCallNotification(Map<String, String> data) {
        return data.containsKey("type") && 
               (data.get("type").equals("call") || data.get("type").equals("video_call"));
    }
    
    /**
     * Handles call notifications by starting the CallService
     */
    private void handleCallNotification(Map<String, String> data) {
        try {
            // Extract call information from notification data
            String callerId = data.get("callerId"); 
            String callerName = data.get("callerName");
            String callType = data.get("type").equals("video_call") ? "video" : "audio";
            String callId = data.get("callId");
            
            if (callerId == null) {
                Log.e(TAG, "Invalid call notification: missing callerId");
                return;
            }
            
            Log.d(TAG, "Incoming call from: " + callerName + " (" + callerId + "), type: " + callType);

            // Ensure we can show heads-up notifications
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationManager notificationManager = 
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                notificationManager.cancelAll(); // Clear any existing notifications
            }
            
            // Start the call service with the extracted information
            Intent serviceIntent = new Intent(this, CallService.class);
            serviceIntent.setAction("INCOMING_CALL");
            serviceIntent.putExtra("callerId", callerId);
            serviceIntent.putExtra("callerName", callerName != null ? callerName : "Unknown caller");
            serviceIntent.putExtra("callType", callType);
            serviceIntent.putExtra("callId", callId != null ? callId : String.valueOf(System.currentTimeMillis()));
            
            // Add flags to ensure service starts in background
            serviceIntent.addFlags(Intent.FLAG_INCLUDE_STOPPED_PACKAGES);
            serviceIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            serviceIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            
            // Start service and keep device awake
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            
            // Also send a broadcast to wake up any sleeping components
            Intent broadcastIntent = new Intent("INCOMING_CALL_BROADCAST");
            broadcastIntent.putExtras(serviceIntent);
            sendBroadcast(broadcastIntent);
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling call notification", e);
        }
    }
}