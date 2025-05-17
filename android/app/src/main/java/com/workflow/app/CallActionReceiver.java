package com.workflow.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class CallActionReceiver extends BroadcastReceiver {
    private static final String TAG = "CallActionReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        String callerId = intent.getStringExtra("callerId");
        String callerName = intent.getStringExtra("callerName");
        String callType = intent.getStringExtra("callType");
        String callId = intent.getStringExtra("callId");
        
        Log.d(TAG, "Received action: " + action + " for call from: " + callerName);
        
        if ("ACCEPT_CALL".equals(action)) {
            // Open the app to handle the call with high priority flags
            Intent launchIntent = new Intent(context, MainActivity.class);
            // FLAG_ACTIVITY_NEW_TASK - Required for starting activity from a non-activity context
            // FLAG_ACTIVITY_CLEAR_TOP - Clear any existing activities of the same task
            // FLAG_ACTIVITY_REORDER_TO_FRONT - Bring MainActivity to front if it exists
            // FLAG_ACTIVITY_NO_ANIMATION - Remove transition animation
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK 
                | Intent.FLAG_ACTIVITY_CLEAR_TOP 
                | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                | Intent.FLAG_ACTIVITY_NO_ANIMATION);
            
            // Instead of using CATEGORY_CALL which doesn't exist, use high priority flag
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
            
            // Add call information
            launchIntent.putExtra("callAction", "accept");
            launchIntent.putExtra("callerId", callerId);
            launchIntent.putExtra("callerName", callerName);
            launchIntent.putExtra("callType", callType);
            launchIntent.putExtra("callId", callId);
            launchIntent.putExtra("showCallScreen", true);  // Special flag to show call UI immediately
            
            // Start activity with urgency
            context.startActivity(launchIntent);
            
            // Stop the call service
            Intent serviceIntent = new Intent(context, CallService.class);
            serviceIntent.setAction("END_CALL");
            context.startService(serviceIntent);
        } 
        else if ("REJECT_CALL".equals(action)) {
            // Handle call rejection - send rejection to JS layer
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            launchIntent.putExtra("callAction", "reject");
            launchIntent.putExtra("callerId", callerId);
            launchIntent.putExtra("callerName", callerName);
            launchIntent.putExtra("callType", callType);
            launchIntent.putExtra("callId", callId);
            
            // This will start the main activity in background to process the rejection
            context.startActivity(launchIntent);
            
            // Stop the call service
            Intent serviceIntent = new Intent(context, CallService.class);
            serviceIntent.setAction("END_CALL");
            context.startService(serviceIntent);
        }
    }
}