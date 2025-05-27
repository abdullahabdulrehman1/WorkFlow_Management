package com.workflow.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Service to handle incoming calls, showing a persistent notification
 * and turning on the screen to show the incoming call activity.
 */
public class CallService extends Service {
    private static final String TAG = "CallService";
    private static final String CHANNEL_ID = "call_channel";
    private static final int NOTIFICATION_ID = 1000;
    private static final int AUTO_DISMISS_TIMEOUT = 45000; // 45 seconds
    
    private MediaPlayer ringtonePlayer;
    private Vibrator vibrator;
    private Handler timeoutHandler;
    private PowerManager.WakeLock wakeLock;
    private Handler mainHandler;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "CallService created");
        
        // Initialize timeout handler
        timeoutHandler = new Handler(Looper.getMainLooper());
        mainHandler = new Handler(Looper.getMainLooper());
        
        // Create the notification channel (required for Android O+)
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) {
            stopSelf();
            return START_NOT_STICKY;
        }
        
        String action = intent.getAction();
        Log.d(TAG, "CallService action: " + action);
        
        switch (action) {
            case "INCOMING_CALL":
                // Handle incoming call
                handleIncomingCall(intent);
                break;
            case "ACCEPT_CALL":
                // Accept the call and stop ringing
                stopRinging();
                stopSelf();
                break;
            case "DECLINE_CALL":
                // Decline the call and stop the service
                stopRinging();
                stopSelf();
                break;
            default:
                stopSelf();
                break;
        }
        
        return START_STICKY;
    }

    /**
     * Handle an incoming call by showing appropriate UI based on app state
     */
    private void handleIncomingCall(Intent intent) {
        // Get call details from intent
        final String callerId = intent.getStringExtra("callerId");
        final String callerName = intent.getStringExtra("callerName");
        final String callType = intent.getStringExtra("callType");
        final String callId = intent.getStringExtra("callId");
        
        if (callerId == null || callerName == null) {
            Log.e(TAG, "Missing call details");
            stopSelf();
            return;
        }
        
        // Acquire wake lock to turn on screen
        acquireWakeLock();
        
        // ALWAYS show notification first for persistent access
        showCallNotification(callerId, callerName, callType, callId);
        
        // Then check if we should launch the activity
        boolean isAppInForeground = isAppInForeground();
        Log.d(TAG, "App is in foreground: " + isAppInForeground + ", launching activity for: " + callerName);
        
        if (isAppInForeground) {
            // App is running - also show CallDecisionActivity
            launchCallDecisionActivity(callerId, callerName, callType, callId);
        }
        
        // Start ringing in both cases
        startRinging();
        
        // Set a timeout to automatically dismiss the call
        timeoutHandler.postDelayed(this::timeoutCall, AUTO_DISMISS_TIMEOUT);
    }
    
    /**
     * Check if the app is currently in foreground
     */
    private boolean isAppInForeground() {
        android.app.ActivityManager activityManager = 
            (android.app.ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (activityManager == null) return false;
        
        java.util.List<android.app.ActivityManager.RunningAppProcessInfo> processes = 
            activityManager.getRunningAppProcesses();
        
        if (processes == null) return false;
        
        String packageName = getPackageName();
        for (android.app.ActivityManager.RunningAppProcessInfo process : processes) {
            if (process.processName.equals(packageName)) {
                return process.importance == android.app.ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;
            }
        }
        return false;
    }
    
    /**
     * Launch CallDecisionActivity for foreground calls
     */
    private void launchCallDecisionActivity(String callerId, String callerName, String callType, String callId) {
        Log.d(TAG, "Launching CallDecisionActivity for foreground call from: " + callerName);
        
        // Add a small delay to ensure notification is shown first
        mainHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                Intent launchIntent = new Intent(CallService.this, CallDecisionActivity.class);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                                   Intent.FLAG_ACTIVITY_CLEAR_TOP | 
                                   Intent.FLAG_ACTIVITY_SINGLE_TOP);
                launchIntent.putExtra("callerId", callerId);
                launchIntent.putExtra("callerName", callerName);
                launchIntent.putExtra("callType", callType);
                launchIntent.putExtra("callId", callId);
                startActivity(launchIntent);
            }
        }, 300);
    }
    
    /**
     * Show persistent notification for all calls
     */
    private void showCallNotification(String callerId, String callerName, String callType, String callId) {
        Log.d(TAG, "Showing persistent call notification for: " + callerName);
        
        // Create accept and decline actions for notification
        Intent acceptIntent = new Intent(this, CallActionReceiver.class);
        acceptIntent.setAction("ACCEPT_CALL");
        acceptIntent.putExtra("callerId", callerId);
        acceptIntent.putExtra("callerName", callerName);
        acceptIntent.putExtra("callType", callType);
        acceptIntent.putExtra("callId", callId);
        
        Intent declineIntent = new Intent(this, CallActionReceiver.class);
        declineIntent.setAction("DECLINE_CALL");
        declineIntent.putExtra("callerId", callerId);
        
        PendingIntent acceptPendingIntent = PendingIntent.getBroadcast(
            this, 0, acceptIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        
        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
            this, 1, declineIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        
        // Create full-screen intent to launch call activity
        Intent fullScreenIntent = new Intent(this, CallDecisionActivity.class);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | 
                               Intent.FLAG_ACTIVITY_CLEAR_TOP |
                               Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra("callerId", callerId);
        fullScreenIntent.putExtra("callerName", callerName);
        fullScreenIntent.putExtra("callType", callType);
        fullScreenIntent.putExtra("callId", callId);
        
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
            this, 2, fullScreenIntent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        
        // Build the notification with high priority and persistent visibility
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(callType.equals("video") ? "Video Call" : "Voice Call")
            .setContentText(callerName)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent) // Tap to open call screen
            .addAction(R.drawable.decline_call_icon, "Decline", declinePendingIntent)
            .addAction(R.drawable.accept_call_icon, "Accept", acceptPendingIntent);
        
        // Start foreground service with the notification
        Notification notification = builder.build();
        startForeground(NOTIFICATION_ID, notification);
    }
    
    /**
     * Timeout the call if not answered
     */
    private void timeoutCall() {
        Log.d(TAG, "Call timed out");
        stopRinging();
        stopSelf();
    }
    
    /**
     * Start playing ringtone and vibrating
     */
    private void startRinging() {
        try {
            // Get the ringtone
            Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            
            // Play ringtone
            ringtonePlayer = new MediaPlayer();
            ringtonePlayer.setDataSource(this, ringtoneUri);
            ringtonePlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            ringtonePlayer.setLooping(true);
            ringtonePlayer.prepare();
            ringtonePlayer.start();
            
            // Start vibration pattern
            vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 1000, 1000};
                
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error starting ringtone", e);
        }
    }
    
    /**
     * Stop ringtone and vibration
     */
    private void stopRinging() {
        // Cancel the timeout
        timeoutHandler.removeCallbacksAndMessages(null);
        
        // Stop ringtone
        if (ringtonePlayer != null) {
            if (ringtonePlayer.isPlaying()) {
                ringtonePlayer.stop();
            }
            ringtonePlayer.release();
            ringtonePlayer = null;
        }
        
        // Stop vibration
        if (vibrator != null) {
            vibrator.cancel();
            vibrator = null;
        }
        
        // Release wake lock
        releaseWakeLock();
    }

    /**
     * Create notification channel for Android O+
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Call Notifications",
                NotificationManager.IMPORTANCE_HIGH
            );
            
            channel.setDescription("Notifications for incoming calls");
            channel.enableLights(true);
            channel.setLightColor(Color.RED);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            
            // Set the channel's sound
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build();
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), audioAttributes);
            
            // Register the channel
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
    
    /**
     * Acquire wake lock to turn on screen
     */
    private void acquireWakeLock() {
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (powerManager != null && wakeLock == null) {
            wakeLock = powerManager.newWakeLock(
                PowerManager.FULL_WAKE_LOCK | 
                PowerManager.ACQUIRE_CAUSES_WAKEUP | 
                PowerManager.ON_AFTER_RELEASE,
                "workflow:callWakeLock"
            );
            wakeLock.acquire(AUTO_DISMISS_TIMEOUT);
        }
    }
    
    /**
     * Release wake lock
     */
    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    @Override
    public void onDestroy() {
        Log.d(TAG, "CallService destroyed");
        stopRinging();
        releaseWakeLock();
        timeoutHandler.removeCallbacksAndMessages(null);
        mainHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}