package com.workflow.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class CallService extends Service {
    private static final int NOTIFICATION_ID = 1001;
    private static final String CHANNEL_ID = "incoming_calls";
    private static final String TAG = "CallService";
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        
        // Acquire a wake lock to ensure the device stays awake for incoming calls
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.FULL_WAKE_LOCK | 
            PowerManager.ACQUIRE_CAUSES_WAKEUP | 
            PowerManager.ON_AFTER_RELEASE, 
            "workflow:callWakeLock");
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if ("INCOMING_CALL".equals(action)) {
                String callerId = intent.getStringExtra("callerId");
                String callerName = intent.getStringExtra("callerName");
                String callType = intent.getStringExtra("callType");
                String callId = intent.getStringExtra("callId");
                
                Log.d(TAG, "Incoming call from: " + callerName + " (" + callerId + "), type: " + callType);
                
                // Ensure the screen turns on for incoming calls
                if (wakeLock != null && !wakeLock.isHeld()) {
                    wakeLock.acquire(60*1000L); // Timeout after 1 minute if not handled
                }
                
                showIncomingCallNotification(callerId, callerName, callType, callId);
            } else if ("END_CALL".equals(action)) {
                // Release wake lock if it's held
                if (wakeLock != null && wakeLock.isHeld()) {
                    wakeLock.release();
                }
                
                stopForeground(true);
                stopSelf();
            }
        }
        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Incoming Calls",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Notifications for incoming calls");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            // Enable lights and set color
            channel.enableLights(true);
            channel.setLightColor(0xFF0000FF); // Blue color
            // Set the channel to be important
            channel.setImportance(NotificationManager.IMPORTANCE_HIGH);
            channel.setBypassDnd(true); // Bypass Do Not Disturb mode
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void showIncomingCallNotification(String callerId, String callerName, String callType, String callId) {
        // Create an intent for the native CallDecisionActivity
        Intent fullScreenIntent = new Intent(this, CallDecisionActivity.class);
        
        // Add all required parameters for Call Decision Screen
        fullScreenIntent.putExtra("callerId", callerId);
        fullScreenIntent.putExtra("callerName", callerName);
        fullScreenIntent.putExtra("callType", callType);
        fullScreenIntent.putExtra("callId", callId);
        
        // Set high priority flags for the full-screen intent
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                               Intent.FLAG_ACTIVITY_CLEAR_TOP | 
                               Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this, 0, fullScreenIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Create accept call intent - which should go directly to the active call screen
        Intent acceptIntent = new Intent(this, CallActionReceiver.class);
        acceptIntent.setAction("ACCEPT_CALL");
        acceptIntent.putExtra("callerId", callerId);
        acceptIntent.putExtra("callerName", callerName);
        acceptIntent.putExtra("callType", callType);
        acceptIntent.putExtra("callId", callId);
        acceptIntent.putExtra("openCallScreen", true); // Flag to ensure call screen opens
        
        // Direct to the actual call screen with proper URL encoding
        String customRoute;
        try {
            // Use URLEncoder for proper encoding of parameters
            String encodedCallerName = java.net.URLEncoder.encode(callerName != null ? callerName : "Unknown", "UTF-8");
            String encodedCallerId = java.net.URLEncoder.encode(callerId, "UTF-8");
            String encodedCallType = java.net.URLEncoder.encode(callType, "UTF-8");
            
            // Build the route with correct parameter names matching frontend expectations
            customRoute = "/call/" + callId + 
                    "?type=" + encodedCallType + 
                    "&caller=" + encodedCallerName +
                    "&recipient=" + encodedCallerId;
                    
            Log.d(TAG, "Creating accept intent with properly encoded route: " + customRoute);
        } catch (Exception e) {
            Log.e(TAG, "Error encoding URL parameters", e);
            // Fallback with basic route if encoding fails
            customRoute = "/call/" + callId;
        }
        
        acceptIntent.putExtra("directCallRoute", customRoute);
        
        PendingIntent acceptPendingIntent = PendingIntent.getBroadcast(
                this, 1, acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        
        // Create reject call intent
        Intent rejectIntent = new Intent(this, CallActionReceiver.class);
        rejectIntent.setAction("REJECT_CALL");
        rejectIntent.putExtra("callerId", callerId);
        rejectIntent.putExtra("callerName", callerName);
        rejectIntent.putExtra("callType", callType);
        rejectIntent.putExtra("callId", callId);
        PendingIntent rejectPendingIntent = PendingIntent.getBroadcast(
                this, 2, rejectIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        // Use the app icon as the notification icon
        int smallIconResId = getApplicationInfo().icon;
        
        // Get the resource ID of the mipmap icon (which is typically the app icon)
        int largeIconResId = getResources().getIdentifier("ic_launcher", "mipmap", getPackageName());
        
        // Create large bitmap icon for the notification
        Bitmap largeIcon = null;
        if (largeIconResId != 0) {
            try {
                largeIcon = BitmapFactory.decodeResource(getResources(), largeIconResId);
            } catch (Exception e) {
                Log.e(TAG, "Error loading large icon", e);
            }
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(smallIconResId)
                .setContentTitle((callType.equals("video") ? "📹 Video Call" : "📞 Audio Call"))
                .setContentText("from " + (callerName != null ? callerName : callerId))
                .setContentIntent(fullScreenPendingIntent) // Set the pending intent for the entire notification
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .setOngoing(true)
                .addAction(android.R.drawable.ic_menu_call, "Accept", acceptPendingIntent)
                .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", rejectPendingIntent)
                .setAutoCancel(false)
                // Add additional settings for better visibility
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC) // Show on lock screen
                .setTimeoutAfter(60000) // Timeout after 1 minute
                .setVibrate(new long[]{0, 1000, 500, 1000, 500, 1000}) // Strong vibration pattern
                .setSound(android.provider.Settings.System.DEFAULT_RINGTONE_URI); // Default ringtone
        
        // Add large icon if available
        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon);
        }
        
        startForeground(NOTIFICATION_ID, builder.build());
    }
    
    @Override
    public void onDestroy() {
        // Make sure to release the wake lock if the service is destroyed
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        super.onDestroy();
    }
}