package com.workflow.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;

public class CallDecisionActivity extends AppCompatActivity {
    private static final String TAG = "CallDecisionActivity";
    private String callerId;
    private String callerName;
    private String callType;
    private String callId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set flags to show the activity on the lock screen and wake up the screen
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        );
        
        setContentView(R.layout.call_decision_layout);
        
        // Get call information from intent
        Intent intent = getIntent();
        if (intent != null) {
            callerId = intent.getStringExtra("callerId");
            callerName = intent.getStringExtra("callerName");
            callType = intent.getStringExtra("callType");
            callId = intent.getStringExtra("callId");
            
            Log.d(TAG, "Call received from: " + callerName + " (" + callerId + "), type: " + callType);
            
            // Update UI with call information
            updateCallUI();
            
            // Set up accept button
            ImageButton acceptButton = findViewById(R.id.accept_call_button);
            if (acceptButton != null) {
                acceptButton.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        acceptCall();
                    }
                });
            }
            
            // Set up reject button
            ImageButton rejectButton = findViewById(R.id.decline_call_button);
            if (rejectButton != null) {
                rejectButton.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        rejectCall();
                    }
                });
            }
        } else {
            // No intent data, close the activity
            Log.e(TAG, "No intent data received for call, closing activity");
            finish();
        }
    }
    
    private void updateCallUI() {
        // Update caller name
        TextView callerNameView = findViewById(R.id.caller_name);
        if (callerNameView != null) {
            callerNameView.setText(callerName != null && !callerName.isEmpty() ? callerName : "Unknown Caller");
        }
        
        // Update call type
        TextView callTypeView = findViewById(R.id.call_type);
        if (callTypeView != null) {
            callTypeView.setText(callType != null && callType.equals("video") ? "Video Call" : "Audio Call");
        }
        
        // Update avatar (we can just use the default avatar provided in the layout)
        ImageView callerAvatar = findViewById(R.id.caller_avatar);
        if (callerAvatar != null) {
            // Here we could load a custom avatar if we had one
            // For now we'll use the default one in the layout
        }
    }
    
    private void acceptCall() {
        Log.d(TAG, "Call accepted: " + callId);
        
        // Create custom route for the call
        String customRoute;
        try {
            String encodedCallerName = java.net.URLEncoder.encode(callerName != null ? callerName : "Unknown", "UTF-8");
            String encodedCallerId = java.net.URLEncoder.encode(callerId, "UTF-8");
            String encodedCallType = java.net.URLEncoder.encode(callType, "UTF-8");
            
            customRoute = "/call/" + callId + 
                    "?type=" + encodedCallType + 
                    "&caller=" + encodedCallerName +
                    "&recipient=" + encodedCallerId;
        } catch (Exception e) {
            Log.e(TAG, "Error encoding URL parameters", e);
            customRoute = "/call/" + callId;
        }
        
        // Send broadcast to CallActionReceiver
        Intent acceptIntent = new Intent(this, CallActionReceiver.class);
        acceptIntent.setAction("ACCEPT_CALL");
        acceptIntent.putExtra("callerId", callerId);
        acceptIntent.putExtra("callerName", callerName);
        acceptIntent.putExtra("callType", callType);
        acceptIntent.putExtra("callId", callId);
        acceptIntent.putExtra("openCallScreen", true);
        acceptIntent.putExtra("directCallRoute", customRoute);
        sendBroadcast(acceptIntent);
        
        // Also send intent to MainActivity to handle the call
        Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.setAction("ACCEPT_CALL");
        mainIntent.putExtra("callId", callId);
        mainIntent.putExtra("callRoute", customRoute);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(mainIntent);
        
        // Close this activity
        finish();
    }
    
    private void rejectCall() {
        Log.d(TAG, "Call rejected: " + callId);
        
        // Send broadcast to CallActionReceiver
        Intent rejectIntent = new Intent(this, CallActionReceiver.class);
        rejectIntent.setAction("REJECT_CALL");
        rejectIntent.putExtra("callerId", callerId);
        rejectIntent.putExtra("callerName", callerName);
        rejectIntent.putExtra("callType", callType);
        rejectIntent.putExtra("callId", callId);
        sendBroadcast(rejectIntent);
        
        // Close the activity
        finish();
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        
        // Update call data in case it changed
        if (intent != null) {
            callerId = intent.getStringExtra("callerId");
            callerName = intent.getStringExtra("callerName");
            callType = intent.getStringExtra("callType");
            callId = intent.getStringExtra("callId");
            
            updateCallUI();
        }
    }
    
    @Override
    protected void onDestroy() {
        // Make sure to stop the call service if the activity is destroyed
        Intent serviceIntent = new Intent(this, CallService.class);
        serviceIntent.setAction("END_CALL");
        startService(serviceIntent);
        
        super.onDestroy();
    }
}