package com.workflow.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import android.provider.Settings.Secure;

import com.google.firebase.messaging.FirebaseMessaging;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class FCMTokenManager {
    private static final String TAG = "FCMTokenManager";
    private static final String PREF_NAME = "FCMTokenPrefs";
    private static final String KEY_FCM_TOKEN = "fcm_token";
    private static final String KEY_TOKEN_SENT = "token_sent_to_server";
    private static final String KEY_SERVER_URL = "server_url";
    
    // Default to a relative URL that works regardless of domain
    private static final String DEFAULT_API_PATH = "/api/fcm/register";
    
    private static FCMTokenManager instance;
    private final Context context;
    private final OkHttpClient client;
    private final ExecutorService executor;

    private FCMTokenManager(Context context) {
        this.context = context.getApplicationContext();
        this.client = new OkHttpClient();
        this.executor = Executors.newSingleThreadExecutor();
    }

    public static synchronized FCMTokenManager getInstance(Context context) {
        if (instance == null) {
            instance = new FCMTokenManager(context);
        }
        return instance;
    }

    /**
     * Set the server URL to use for FCM registration
     * @param url Full server URL (e.g., "https://your-domain.com")
     */
    public void setServerUrl(String url) {
        if (url == null || url.isEmpty()) {
            return;
        }
        
        // Remove trailing slash if present
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_SERVER_URL, url);
        editor.apply();
        
        // Mark token as not sent so it will be re-sent to the new URL
        setTokenSentToServer(false);
        
        Log.d(TAG, "Server URL set to: " + url);
    }
    
    /**
     * Get the full API URL for FCM token registration
     */
    private String getApiUrl() {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String baseUrl = sharedPreferences.getString(KEY_SERVER_URL, null);
        
        if (baseUrl == null || baseUrl.isEmpty()) {
            // Use MainActivity's URL if available
            baseUrl = MainActivity.getServerUrl();
            
            if (baseUrl == null || baseUrl.isEmpty()) {
                // Default to a placeholder that will fail gracefully
                baseUrl = "https://workflow-default";
                Log.w(TAG, "Using default URL as no server URL is configured");
            }
        }
        
        return baseUrl + DEFAULT_API_PATH;
    }
    
    /**
     * Simple check if a URL is reachable - non-blocking
     */
    private boolean isUrlReachable(String url) {
        try {
            Request request = new Request.Builder()
                .url(url)
                .head() // HEAD request is lightweight
                .build();
            
            Response response = client.newCall(request).execute();
            response.close();
            return response.isSuccessful();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Retrieve the current FCM token and register it with the server
     */
    public void retrieveAndSendToken() {
        FirebaseMessaging.getInstance().getToken()
                .addOnCompleteListener(task -> {
                    if (!task.isSuccessful()) {
                        Log.w(TAG, "Failed to retrieve FCM token", task.getException());
                        return;
                    }

                    String token = task.getResult();
                    if (token == null) {
                        Log.e(TAG, "FCM token is null");
                        return;
                    }

                    String oldToken = getStoredToken();
                    if (!token.equals(oldToken) || !isTokenSentToServer()) {
                        // Save the new token and send to server
                        storeToken(token);
                        sendTokenToServer(token);
                    } else {
                        Log.d(TAG, "Token already sent to server");
                    }
                });
    }

    /**
     * Send the FCM token to your server
     */
    private void sendTokenToServer(String token) {
        executor.execute(() -> {
            try {
                String apiUrl = getApiUrl();
                Log.d(TAG, "Sending FCM token to: " + apiUrl);
                
                // Get the device ID for identifying this device
                String deviceId = getDeviceId();
                
                // Prepare the request body with device information
                String json = String.format(
                    "{\"token\":\"%s\",\"device_id\":\"%s\",\"platform\":\"android\"}", 
                    token, 
                    deviceId
                );
                
                RequestBody body = RequestBody.create(
                    MediaType.parse("application/json; charset=utf-8"), json);
                
                Request request = new Request.Builder()
                    .url(apiUrl)
                    .addHeader("Accept", "application/json")
                    .addHeader("Content-Type", "application/json")
                    .post(body)
                    .build();
                
                client.newCall(request).enqueue(new Callback() {
                    @Override
                    public void onFailure(Call call, IOException e) {
                        Log.e(TAG, "Failed to send token to server: " + e.getMessage(), e);
                        setTokenSentToServer(false);
                    }

                    @Override
                    public void onResponse(Call call, Response response) throws IOException {
                        if (response.isSuccessful()) {
                            Log.d(TAG, "Token sent to server successfully");
                            setTokenSentToServer(true);
                        } else {
                            String responseBody = response.body() != null ? response.body().string() : "No response body";
                            Log.e(TAG, "Failed to send token to server. Response: " + response.code() + " - " + responseBody);
                            setTokenSentToServer(false);
                        }
                        response.close();
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "Error sending token to server", e);
                setTokenSentToServer(false);
            }
        });
    }
    
    /**
     * Get a unique device ID
     */
    private String getDeviceId() {
        String deviceId = Secure.getString(context.getContentResolver(), Secure.ANDROID_ID);
        return deviceId != null ? deviceId : "unknown_device";
    }

    /**
     * Store the token locally
     */
    private void storeToken(String token) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(KEY_FCM_TOKEN, token);
        editor.apply();
    }

    /**
     * Get the stored token
     */
    private String getStoredToken() {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return sharedPreferences.getString(KEY_FCM_TOKEN, "");
    }

    /**
     * Set whether token has been sent to server
     */
    private void setTokenSentToServer(boolean sent) {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putBoolean(KEY_TOKEN_SENT, sent);
        editor.apply();
    }

    /**
     * Check if token has been sent to server
     */
    private boolean isTokenSentToServer() {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return sharedPreferences.getBoolean(KEY_TOKEN_SENT, false);
    }

    /**
     * Delete the stored token
     */
    public void deleteToken() {
        SharedPreferences sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.remove(KEY_FCM_TOKEN);
        editor.remove(KEY_TOKEN_SENT);
        editor.apply();
    }
}