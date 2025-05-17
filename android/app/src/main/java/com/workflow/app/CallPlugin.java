package com.workflow.app;

import android.content.Intent;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CallPlugin")
public class CallPlugin extends Plugin {
    private static final String TAG = "CallPlugin";

    @PluginMethod
    public void startCall(PluginCall call) {
        String callerId = call.getString("callerId");
        String callerName = call.getString("callerName", "Unknown");
        String callType = call.getString("callType", "audio");
        
        if (callerId == null) {
            call.reject("Caller ID is required");
            return;
        }
        
        try {
            String callId = String.valueOf(System.currentTimeMillis());
            
            Intent serviceIntent = new Intent(getContext(), CallService.class);
            serviceIntent.setAction("INCOMING_CALL");
            serviceIntent.putExtra("callerId", callerId);
            serviceIntent.putExtra("callerName", callerName);
            serviceIntent.putExtra("callType", callType);
            serviceIntent.putExtra("callId", callId);
            
            getContext().startService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("callId", callId);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error starting call", e);
            call.reject("Failed to start call: " + e.getMessage());
        }
    }
    
    @PluginMethod
    public void endCall(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), CallService.class);
            serviceIntent.setAction("END_CALL");
            getContext().startService(serviceIntent);
            
            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error ending call", e);
            call.reject("Failed to end call: " + e.getMessage());
        }
    }
    
    // This is called when the app is already open and we receive a call intent
    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        
        // Check if this is a call-related intent
        if (intent.hasExtra("callAction")) {
            String callAction = intent.getStringExtra("callAction");
            String callerId = intent.getStringExtra("callerId");
            String callerName = intent.getStringExtra("callerName");
            String callType = intent.getStringExtra("callType");
            String callId = intent.getStringExtra("callId");
            
            // Create event data
            JSObject eventData = new JSObject();
            eventData.put("action", callAction);
            eventData.put("callerId", callerId);
            eventData.put("callerName", callerName);
            eventData.put("callType", callType);
            eventData.put("callId", callId);
            
            // Notify our JS layer about the call action
            notifyListeners("callAction", eventData);
        }
    }
}