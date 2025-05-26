package com.workflow.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.webkit.ValueCallback;
import android.content.SharedPreferences;
import android.content.Context;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final int OVERLAY_PERMISSION_REQ_CODE = 1234;
    private static final String PREF_NAME = "WorkflowAppPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static String cachedServerUrl = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register plugins before calling super.onCreate
        registerPlugins(NativePlugins.getPluginClasses());
        
        super.onCreate(savedInstanceState);
        
        // Request overlay permission if not granted
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            startActivityForResult(intent, OVERLAY_PERMISSION_REQ_CODE);
        }

        // Request battery optimization exemption
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
            String packageName = getPackageName();
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                Intent intent = new Intent();
                intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + packageName));
                startActivity(intent);
            }
        }
        
        // Initialize FCM token manager
        initializeFCM();
        
        // Handle intent if started from a notification
        handleCallIntent(getIntent());

        // Set default server URL if not set
        if (getServerUrl() == null) {
            setServerUrl(getDefaultServerUrl());
        }
    }
    
    /**
     * Get the server URL - can be called from other classes
     */
    public static String getServerUrl() {
        return cachedServerUrl;
    }
    
    /**
     * Set the server URL and save it to preferences
     */
    public void setServerUrl(String url) {
        if (url == null || url.isEmpty()) {
            return;
        }
        
        // Remove trailing slash if present
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        
        // Save to preferences
        SharedPreferences prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_SERVER_URL, url);
        editor.apply();
        
        // Update cache
        cachedServerUrl = url;
        
        // Notify FCM token manager of URL change
        FCMTokenManager.getInstance(this).setServerUrl(url);
    }
    
    /**
     * Get the server URL from preferences
     */
    private String loadServerUrl() {
        SharedPreferences prefs = getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String url = prefs.getString(KEY_SERVER_URL, null);
        cachedServerUrl = url;
        return url;
    }
    
    /**
     * Get the default server URL based on environment
     */
    private String getDefaultServerUrl() {
        // Development URLs in order of preference
        String[] devUrls = {
            "http://192.168.45.226:8000",  // Emulator special IP
            "http://10.0.2.2:8000",       // Another emulator address
            "http://localhost:8000"       // Last resort
        };
            
        // Try each URL
        for (String url : devUrls) {
            if (isUrlReachable(url)) {
                return url;
            }
        }
        
        // Production URL
        return "https://workflow.yourdomain.com";  // Replace with your actual production URL
    }
    
    /**
     * Check if a URL is reachable
     */
    private boolean isUrlReachable(String urlString) {
        try {
            java.net.URL url = new java.net.URL(urlString);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(1000);  // 1 second timeout
            conn.setRequestMethod("HEAD");
            int responseCode = conn.getResponseCode();
            return (200 <= responseCode && responseCode <= 399);
        } catch (Exception e) {
            return false;
        }
    }
    
    private void initializeFCM() {
        try {
            // Initialize FCM token management
            FCMTokenManager.getInstance(this).retrieveAndSendToken();
        } catch (Exception e) {
            Log.e(TAG, "Error initializing FCM", e);
        }
    }
    
    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleCallIntent(intent);
    }
    
    private void handleCallIntent(Intent intent) {
        if (intent == null) return;
        
        // Check if this is a call-related intent
        String action = intent.getAction();
        if (action != null && (action.equals("ACCEPT_CALL") || action.equals("REJECT_CALL"))) {
            String callAction = action.equals("ACCEPT_CALL") ? "accept" : "reject";
            String callerId = intent.getStringExtra("callerId");
            String callerName = intent.getStringExtra("callerName");
            String callType = intent.getStringExtra("callType");
            String callId = intent.getStringExtra("callId");
            
            Log.d(TAG, "Call " + callAction + " intent received for " + callerId);
            
            // For accepted calls, navigate to the call route if provided
            if (action.equals("ACCEPT_CALL") && intent.hasExtra("callRoute")) {
                String callRoute = intent.getStringExtra("callRoute");
                if (callRoute != null && !callRoute.isEmpty()) {
                    // Use the bridge instance to navigate to the specific URL
                    Log.d(TAG, "Navigating to call route: " + callRoute);
                    // Fixed: Adding the required callback parameter
                    bridge.eval("window.location.href = '" + callRoute + "';", new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            Log.d(TAG, "Navigation result: " + value);
                        }
                    });
                }
            }
            
            // Notify the JS layer about the call action through the CallPlugin
            bridge.triggerWindowJSEvent(
                "callAction", 
                "{ \"action\": \"" + callAction + "\", " +
                "\"callerId\": \"" + (callerId != null ? callerId : "") + "\", " +
                "\"callerName\": \"" + (callerName != null ? callerName : "Unknown") + "\", " +
                "\"callType\": \"" + (callType != null ? callType : "audio") + "\", " +
                "\"callId\": \"" + (callId != null ? callId : "") + "\" }"
            );
        }
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == OVERLAY_PERMISSION_REQ_CODE) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                Log.e("MainActivity", "Overlay permission is not granted");
                // You might want to show a message to the user here
            } else {
                Log.d("MainActivity", "Overlay permission granted");
            }
        }
        super.onActivityResult(requestCode, resultCode, data);
    }
}
