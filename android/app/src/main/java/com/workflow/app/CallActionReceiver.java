package com.workflow.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Broadcast receiver for handling call actions (accept/decline) from notifications.
 */
public class CallActionReceiver extends BroadcastReceiver {
    private static final String TAG = "CallActionReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) {
            return;
        }

        String action = intent.getAction();
        String callerId = intent.getStringExtra("callerId");
        String callerName = intent.getStringExtra("callerName");
        String callType = intent.getStringExtra("callType");
        String callId = intent.getStringExtra("callId");

        Log.d(TAG, "Call action received: " + action + " for caller: " + callerName);

        // Stop the call service
        Intent serviceIntent = new Intent(context, CallService.class);
        serviceIntent.setAction(action);
        context.startService(serviceIntent);

        // If call was accepted, launch the main app with call parameters
        if ("ACCEPT_CALL".equals(action)) {
            // Launch main activity with call information
            Intent mainIntent = new Intent(context, MainActivity.class);
            mainIntent.setAction("ACCEPT_CALL");
            mainIntent.putExtra("callerId", callerId);
            mainIntent.putExtra("callerName", callerName);
            mainIntent.putExtra("callType", callType);
            mainIntent.putExtra("callId", callId);
            mainIntent.putExtra("callRoute", "/call/" + callId + "?caller=" + callerName + "&type=" + callType);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            context.startActivity(mainIntent);
        } else if ("DECLINE_CALL".equals(action)) {
            // Notify the main activity that call was declined (if it's running)
            Intent mainIntent = new Intent(context, MainActivity.class);
            mainIntent.setAction("REJECT_CALL");
            mainIntent.putExtra("callerId", callerId);
            mainIntent.putExtra("callId", callId);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(mainIntent);
        }
    }
}