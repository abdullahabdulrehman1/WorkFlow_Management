package com.workflow.app;

import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCMCallService";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        // Check if message contains a data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
            Map<String, String> data = remoteMessage.getData();

            // Check if this is a call notification
            if ("call".equals(data.get("type"))) {
                handleIncomingCall(data);
            }
        }

        // Check if message contains a notification payload
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
        }
    }

    private void handleIncomingCall(Map<String, String> data) {
        Log.d(TAG, "Handling incoming call: " + data.toString());
        
        String callerId = data.get("callerId");
        String callerName = data.get("callerName");
        String callType = data.get("callType");
        String callId = data.get("callId");
        
        if (callerId != null) {
            // Start call service with full-screen intent
            Intent intent = new Intent(this, CallService.class);
            intent.setAction("INCOMING_CALL");
            intent.putExtra("callerId", callerId);
            intent.putExtra("callerName", callerName);
            intent.putExtra("callType", callType != null ? callType : "audio");
            intent.putExtra("callId", callId != null ? callId : String.valueOf(System.currentTimeMillis()));
            startService(intent);
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        Log.d(TAG, "Refreshed token: " + token);
        
        // Send token to your app server to enable sending FCM messages to this device
        sendRegistrationToServer(token);
    }

    private void sendRegistrationToServer(String token) {
        // In a real app, this would send the token to your server
        // For this example, we just log it
        Log.d(TAG, "FCM Token registered: " + token);
    }
}