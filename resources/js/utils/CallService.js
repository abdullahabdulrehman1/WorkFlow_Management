/**
 * CallService.js - Utility for handling phone calls in web and mobile environments
 */

import axios from 'axios';
import { toast } from 'react-hot-toast';

// Import Capacitor core for better native platform detection
import { Capacitor } from '@capacitor/core';

// Enhanced mobile detection - checks Capacitor, Cordova, and user agent
const isCapacitorNative = () => {
    // Check if Capacitor is available and we're on a native platform
    const hasCapacitor = typeof window !== 'undefined' && 
                          window.Capacitor !== undefined && 
                          Capacitor.isNativePlatform && 
                          Capacitor.isNativePlatform();
    
    // Check if Cordova is available (some Capacitor apps also expose Cordova)
    const hasCordova = typeof window !== 'undefined' && window.cordova !== undefined;
    
    // Check user agent as fallback
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    
    // Debug information
    console.log('[CallService] Environment detection:', { 
        hasCapacitor, 
        hasCordova,
        isMobileUserAgent,
        platform: Capacitor.getPlatform ? Capacitor.getPlatform() : 'unknown',
        userAgent: userAgent.substring(0, 50) + '...' // Log part of user agent for debugging
    });
    
    // Return true if any mobile detection method succeeds
    return hasCapacitor || hasCordova || isMobileUserAgent;
};

// Check if the device is on Android
const isAndroid = () => {
    if (typeof window !== 'undefined' && window.Capacitor) {
        return Capacitor.getPlatform() === 'android';
    }
    return typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
};

// Check if the device is on iOS
const isIOS = () => {
    if (typeof window !== 'undefined' && window.Capacitor) {
        return Capacitor.getPlatform() === 'ios';
    }
    return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

/**
 * Get the appropriate call plugin implementation
 * 
 * @returns {object} Call plugin implementation
 */
const getCallPlugin = () => {
    try {
        // Check if Capacitor's native call plugin is available
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CallPlugin) {
            console.log('[CallService] Using Capacitor CallPlugin');
            return window.Capacitor.Plugins.CallPlugin;
        }
        
        // Try to dynamically register the plugin
        if (window.Capacitor) {
            try {
                const { registerPlugin } = require('@capacitor/core');
                const capacitorCallPlugin = registerPlugin('CallPlugin');
                console.log('[CallService] Registered Capacitor CallPlugin dynamically');
                return capacitorCallPlugin;
            } catch (err) {
                console.warn('[CallService] Failed to register Capacitor CallPlugin:', err);
            }
        }
        
        // Fallback: Define a web-compatible interface
        return {
            startCall: async ({ phoneNumber, isVideo }) => {
                console.log('[CallService] Using web fallback for startCall');
                // Don't use direct native call by default, as we prioritize FCM notifications
                return { success: false, platform: 'web-fallback' };
            },
            endCall: async () => {
                console.log('[CallService] Web fallback for endCall');
                return { success: true };
            }
        };
    } catch (err) {
        console.error('[CallService] Error setting up CallPlugin:', err);
        return null;
    }
};

/**
 * Send a call notification to FCM (Firebase Cloud Messaging) for Android devices
 * 
 * @param {string} phoneNumber - The phone number to call
 * @param {boolean} isVideo - Whether to make a video call
 * @returns {Promise<object>} - The result of the call attempt
 */
const sendFCMCallNotification = async (phoneNumber, isVideo = false) => {
    try {
        console.log('[CallService] Sending FCM call notification', { phoneNumber, isVideo });
        
        const response = await axios.post('/api/calls/notify', {
            phone_number: phoneNumber,
            call_type: isVideo ? 'video_call' : 'call',
            caller_name: 'Web User', // You might want to get this from user profile
            caller_id: 'web_user_' + Date.now(),  // Generate a unique caller ID
        });
        
        console.log('[CallService] FCM call notification response:', response.data);
        
        if (response.data.success) {
            toast.success('Call notification sent to connected devices');
            return {
                success: true,
                platform: 'fcm',
                callId: response.data.call_id,
                sentToDevices: response.data.sent_count || 0
            };
        } else {
            console.error('[CallService] FCM notification failed:', response.data.message);
            // Include error details in logs for better debugging
            if (response.data.error_details) {
                console.error('[CallService] Error details:', response.data.error_details);
            }
            throw new Error(response.data.message || 'Failed to send call notification');
        }
    } catch (error) {
        console.error('[CallService] Error sending FCM call notification:', error);
        // Provide more detailed error logging
        if (error.response) {
            console.error('[CallService] Server response:', error.response.data);
        }
        throw error;
    }
};

/**
 * Make a direct native call using tel: or facetime: protocols
 * This is now a fallback method, not the primary call method
 * 
 * @param {string} phoneNumber - The phone number to call
 * @param {boolean} isVideo - Whether to make a video call
 * @returns {object} Result of the call attempt
 */
const makeDirectNativeCall = (phoneNumber, isVideo = false) => {
    try {
        // Choose appropriate URL scheme
        const scheme = isVideo ? 'facetime:' : 'tel:';
        const url = scheme + phoneNumber;
        
        console.log(`[CallService] Initiating direct ${isVideo ? 'video' : 'voice'} call to ${phoneNumber} with scheme: ${scheme}`);
        
        // Create an invisible anchor element and trigger it
        const callAnchor = document.createElement('a');
        callAnchor.setAttribute('href', url);
        callAnchor.setAttribute('target', '_system');
        callAnchor.style.display = 'none';
        document.body.appendChild(callAnchor);
        
        // Trigger a click on the anchor
        callAnchor.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(callAnchor);
        }, 100);
        
        return { success: true, platform: isVideo ? 'facetime' : 'tel-protocol' };
    } catch (error) {
        console.error('[CallService] Direct native call failed:', error);
        return { success: false, error: error.message, platform: 'direct-native-failed' };
    }
};

// Get the call plugin early
const CallPlugin = getCallPlugin();

/**
 * Make a call to the specified phone number - prioritizes FCM notifications
 * 
 * @param {string} phoneNumber - The phone number to call
 * @param {boolean} isVideo - Whether to make a video call (default: false)
 * @returns {Promise<object>} - The result of the call attempt
 */
export const makeCall = async (phoneNumber, isVideo = false) => {
    try {
        // Validate phone number
        if (!phoneNumber) {
            throw new Error('Phone number is required');
        }

        // Format phone number (remove non-numeric characters except +)
        const formattedNumber = phoneNumber.replace(/[^\d+]/g, '');
        
        // Log platform detection
        const isMobile = isCapacitorNative();
        const platformDetails = {
            isMobile,
            isAndroidDevice: isAndroid(),
            isIOSDevice: isIOS(),
            hasPlugins: window.plugins && window.plugins.CallNumber,
            hasCapacitorCallPlugin: CallPlugin != null,
            hasAndroidBridge: window.androidBridge
        };
        
        console.log('[CallService] Platform detection:', platformDetails);
        
        // ALWAYS try to send FCM notification first for all platforms
        // This will notify all connected Android devices even if this device is web
        try {
            console.log('[CallService] Sending FCM call notification as primary method');
            return await sendFCMCallNotification(formattedNumber, isVideo);
        } catch (fcmError) {
            console.warn('[CallService] FCM notification failed:', fcmError);
            console.warn('[CallService] Falling back to alternative methods');
            
            // Display a user-friendly error
            toast.error('Could not send call notification to devices. Trying alternative methods...');
            
            // Continue with direct call methods below only as fallbacks
        }
        
        // Handle based on platform - these are all fallback methods
        if (isMobile) {
            // First try Capacitor Call Plugin (preferred method)
            if (CallPlugin) {
                try {
                    console.log('[CallService] Using Capacitor CallPlugin as fallback');
                    const result = await CallPlugin.startCall({
                        phoneNumber: formattedNumber,
                        isVideo
                    });
                    console.log('[CallService] Capacitor CallPlugin result:', result);
                    return { ...result, platform: 'capacitor-plugin' };
                } catch (err) {
                    console.error('[CallService] Capacitor CallPlugin error:', err);
                    // Fall through to other methods
                }
            }
            
            // Try plugin approaches
            if (window.plugins && window.plugins.CallNumber) {
                console.log('[CallService] Using CallNumber plugin as fallback');
                return new Promise((resolve, reject) => {
                    window.plugins.CallNumber.callNumber(
                        (success) => resolve({ success, platform: 'native-plugin' }),
                        (error) => reject(new Error(error)),
                        formattedNumber,
                        isVideo
                    );
                });
            } else if (isAndroid() && window.androidBridge) {
                console.log('[CallService] Using Android bridge as fallback');
                window.androidBridge.makePhoneCall(formattedNumber, isVideo);
                return { success: true, platform: 'android-bridge' };
            } else {
                // Direct native call approach as last resort
                console.log('[CallService] Using direct native call as last resort');
                return makeDirectNativeCall(formattedNumber, isVideo);
            }
        } else {
            // Web implementation - trying alternative backend API
            console.log('[CallService] Using web implementation as fallback');
            return webCall(formattedNumber, isVideo);
        }
    } catch (error) {
        console.error('[CallService] Error making call:', error);
        toast.error('Failed to initiate call: ' + error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Handle web-based calling via your backend API or web RTC
 * 
 * @param {string} phoneNumber - The phone number to call
 * @param {boolean} isVideo - Whether to make a video call
 * @returns {Promise<object>} - The result of the call attempt
 */
const webCall = async (phoneNumber, isVideo = false) => {
    try {
        console.log('[CallService] Initiating web call for', { phoneNumber, isVideo });
        
        // For web, we'll try an alternative API endpoint for initiating calls
        try {
            const response = await axios.post('/api/calls/initiate', {
                phone_number: phoneNumber,
                is_video: isVideo
            });
            
            if (response.data && response.data.success) {
                toast.success('Call initiated successfully');
                return { 
                    success: true, 
                    platform: 'web-api',
                    callId: response.data.call_id 
                };
            } else {
                throw new Error(response.data.message || 'Unknown error');
            }
        } catch (apiError) {
            console.warn('[CallService] API call method failed:', apiError);
            
            // As absolute last resort, fall back to direct tel: URL
            // But warn the user this is not the optimal method
            toast.warning('Using direct call method. Note: This won\'t notify your other devices.');
            
            // Fall back to redirect approach
            const result = makeDirectNativeCall(phoneNumber, isVideo);
            return { ...result, fallback: true };
        }
    } catch (error) {
        console.error('[CallService] Web call error:', error);
        
        // If this is a backend API not found error, show a more helpful message
        if (error.response && error.response.status === 404) {
            toast.error('Call service is not available');
        } else {
            toast.error('Failed to initiate call: ' + (error.message || 'Unknown error'));
        }
        
        return { success: false, error: error.message };
    }
};

/**
 * Get available phone numbers for testing
 * 
 * @returns {Array<object>} List of phone numbers with details
 */
export const getTestPhoneNumbers = () => {
    return [
        { 
            name: 'Office', 
            number: '+1234567890',
            type: 'office'
        },
        { 
            name: 'Support', 
            number: '+1987654321',
            type: 'support'
        },
        { 
            name: 'Emergency', 
            number: '+1555123456',
            type: 'emergency'
        }
    ];
};