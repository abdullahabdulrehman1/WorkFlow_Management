package com.workflow.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import android.util.Log;
import android.animation.AnimatorSet;
import android.animation.ObjectAnimator;
import android.animation.ValueAnimator;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.LinearInterpolator;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Looper;
import android.app.KeyguardManager;
import android.content.Context;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class CallDecisionActivity extends AppCompatActivity {
    private static final String TAG = "CallDecisionActivity";
    private String callerId;
    private String callerName;
    private String callType;
    private String callId;
    
    private View pulseRing1;
    private View pulseRing2;
    private View pulseRing3;
    private AnimatorSet pulseAnimatorSet;
    private Handler animationHandler;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Set flags to show the activity on the lock screen and wake up the screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            
            KeyguardManager keyguardManager = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            keyguardManager.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            );
        }
        
        // Set additional window flags for highest priority
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN |
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS |
            WindowManager.LayoutParams.FLAG_LAYOUT_INSET_DECOR |
            WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS |
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE |
            WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM
        );
        
        // Make activity appear on top of the lock screen
        getWindow().setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY);
        
        // Hide system UI for immersive experience
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (insetsController != null) {
            insetsController.hide(WindowInsetsCompat.Type.systemBars());
            insetsController.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        }
        
        setContentView(R.layout.call_decision_layout);
        
        // Initialize animation handler
        animationHandler = new Handler(Looper.getMainLooper());
        
        // Get references to pulse rings
        pulseRing1 = findViewById(R.id.pulse_ring_1);
        pulseRing2 = findViewById(R.id.pulse_ring_2);
        pulseRing3 = findViewById(R.id.pulse_ring_3);
        
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
            
            // Start pulse animations
            startPulseAnimations();
            
            // Set up accept button
            ImageButton acceptButton = findViewById(R.id.accept_call_button);
            if (acceptButton != null) {
                acceptButton.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        addButtonClickAnimation(v);
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
                        addButtonClickAnimation(v);
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
    
    private void startPulseAnimations() {
        if (pulseRing1 == null || pulseRing2 == null || pulseRing3 == null) {
            return;
        }
        
        pulseAnimatorSet = new AnimatorSet();
        
        // Initial setup - hide rings
        pulseRing1.setScaleX(1.0f);
        pulseRing1.setScaleY(1.0f);
        pulseRing1.setAlpha(1.0f);
        
        pulseRing2.setScaleX(1.0f);
        pulseRing2.setScaleY(1.0f);
        pulseRing2.setAlpha(0.0f);
        
        pulseRing3.setScaleX(1.0f);
        pulseRing3.setScaleY(1.0f);
        pulseRing3.setAlpha(0.0f);
        
        // Ring 1 animation
        ObjectAnimator scaleXRing1 = ObjectAnimator.ofFloat(pulseRing1, "scaleX", 1.0f, 1.6f);
        ObjectAnimator scaleYRing1 = ObjectAnimator.ofFloat(pulseRing1, "scaleY", 1.0f, 1.6f);
        ObjectAnimator alphaRing1 = ObjectAnimator.ofFloat(pulseRing1, "alpha", 1.0f, 0.0f);
        
        scaleXRing1.setRepeatCount(ValueAnimator.INFINITE);
        scaleYRing1.setRepeatCount(ValueAnimator.INFINITE);
        alphaRing1.setRepeatCount(ValueAnimator.INFINITE);
        scaleXRing1.setDuration(3000);
        scaleYRing1.setDuration(3000);
        alphaRing1.setDuration(3000);
        
        // Ring 2 animation with delay
        ObjectAnimator scaleXRing2 = ObjectAnimator.ofFloat(pulseRing2, "scaleX", 1.0f, 1.6f);
        ObjectAnimator scaleYRing2 = ObjectAnimator.ofFloat(pulseRing2, "scaleY", 1.0f, 1.6f);
        ObjectAnimator alphaRing2 = ObjectAnimator.ofFloat(pulseRing2, "alpha", 1.0f, 0.0f);
        
        scaleXRing2.setRepeatCount(ValueAnimator.INFINITE);
        scaleYRing2.setRepeatCount(ValueAnimator.INFINITE);
        alphaRing2.setRepeatCount(ValueAnimator.INFINITE);
        scaleXRing2.setDuration(3000);
        scaleYRing2.setDuration(3000);
        alphaRing2.setDuration(3000);
        scaleXRing2.setStartDelay(1000);
        scaleYRing2.setStartDelay(1000);
        alphaRing2.setStartDelay(1000);
        
        // Ring 3 animation with more delay
        ObjectAnimator scaleXRing3 = ObjectAnimator.ofFloat(pulseRing3, "scaleX", 1.0f, 1.6f);
        ObjectAnimator scaleYRing3 = ObjectAnimator.ofFloat(pulseRing3, "scaleY", 1.0f, 1.6f);
        ObjectAnimator alphaRing3 = ObjectAnimator.ofFloat(pulseRing3, "alpha", 1.0f, 0.0f);
        
        scaleXRing3.setRepeatCount(ValueAnimator.INFINITE);
        scaleYRing3.setRepeatCount(ValueAnimator.INFINITE);
        alphaRing3.setRepeatCount(ValueAnimator.INFINITE);
        scaleXRing3.setDuration(3000);
        scaleYRing3.setDuration(3000);
        alphaRing3.setDuration(3000);
        scaleXRing3.setStartDelay(2000);
        scaleYRing3.setStartDelay(2000);
        alphaRing3.setStartDelay(2000);
        
        // Add all animations to set
        pulseAnimatorSet.playTogether(
            scaleXRing1, scaleYRing1, alphaRing1,
            scaleXRing2, scaleYRing2, alphaRing2,
            scaleXRing3, scaleYRing3, alphaRing3
        );
        
        pulseAnimatorSet.setInterpolator(new LinearInterpolator());
        
        // Delayed start for a better visual effect
        animationHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                // Show rings before starting animation
                pulseRing1.setAlpha(1.0f);
                animationHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        pulseRing2.setAlpha(1.0f);
                    }
                }, 1000);
                
                animationHandler.postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        pulseRing3.setAlpha(1.0f);
                    }
                }, 2000);
                
                // Start animation
                pulseAnimatorSet.start();
            }
        }, 500);
    }
    
    private void addButtonClickAnimation(View view) {
        view.animate()
            .scaleX(0.9f)
            .scaleY(0.9f)
            .setDuration(100)
            .withEndAction(new Runnable() {
                @Override
                public void run() {
                    view.animate()
                        .scaleX(1.0f)
                        .scaleY(1.0f)
                        .setDuration(100);
                }
            });
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
    protected void onPause() {
        super.onPause();
        // Stop animations to save resources
        if (pulseAnimatorSet != null) {
            pulseAnimatorSet.pause();
        }
    }
    
    @Override
    protected void onResume() {
        super.onResume();
        // Resume animations
        if (pulseAnimatorSet != null && pulseAnimatorSet.isPaused()) {
            pulseAnimatorSet.resume();
        }
    }
    
    @Override
    protected void onDestroy() {
        // Clean up animations
        if (pulseAnimatorSet != null) {
            pulseAnimatorSet.cancel();
            pulseAnimatorSet = null;
        }
        
        if (animationHandler != null) {
            animationHandler.removeCallbacksAndMessages(null);
            animationHandler = null;
        }
        
        // Make sure to stop the call service if the activity is destroyed
        Intent serviceIntent = new Intent(this, CallService.class);
        serviceIntent.setAction("END_CALL");
        startService(serviceIntent);
        
        super.onDestroy();
    }
}