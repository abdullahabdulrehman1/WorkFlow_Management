package com.workflow.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

public class IncomingCallReceiver extends BroadcastReceiver {
    private static final String TAG = "IncomingCallReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Received incoming call broadcast");
        
        if (intent.getAction() != null && intent.getAction().equals("INCOMING_CALL_BROADCAST")) {
            // Create a new intent for the CallService with all the extras
            Intent serviceIntent = new Intent(context, CallService.class);
            serviceIntent.setAction("INCOMING_CALL");
            serviceIntent.putExtras(intent);
            
            // Start the service
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        }
    }
}