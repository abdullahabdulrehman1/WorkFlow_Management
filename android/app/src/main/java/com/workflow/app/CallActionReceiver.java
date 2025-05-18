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
            // Open the app to handle the call
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            launchIntent.putExtra("callAction", "accept");
            launchIntent.putExtra("callerId", callerId);
            launchIntent.putExtra("callerName", callerName);
            launchIntent.putExtra("callType", callType);
            launchIntent.putExtra("callId", callId);
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