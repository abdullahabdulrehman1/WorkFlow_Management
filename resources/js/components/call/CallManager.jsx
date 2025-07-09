import React, { useState, useEffect, createContext, useContext } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { CallPlugin } from '../../utils/iOSSimpleCall'; // Import the singleton instance

// Create context for call-related functionality
const CallContext = createContext();

// Hook for accessing call functionality throughout the app
export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const [callState, setCallState] = useState({
    isIncomingCall: false,
    isOngoingCall: false,
    callerId: null,
    callerName: null,
    callType: 'audio',
    callStartTime: null,
    callId: null,
    callStatus: 'idle', // idle, ringing, connected, ended
  });

  // Initialize call-related listeners
  useEffect(() => {
    const setupCallListeners = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Request permissions for push notifications
          await PushNotifications.requestPermissions();
          
          // Register with FCM
          await PushNotifications.register();

          // Register for FCM token (both Android and iOS)
          try {
            const { token } = await FCM.getToken();
            console.log('FCM Token:', token);
            
            // Generate keys for web push format (aes128gcm)
            const generateWebPushKeys = () => {
              // Generate random keys for aes128gcm format
              const publicKey = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(65))));
              const authToken = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
              return { publicKey, authToken };
            };
            
            // Send the token to your server with platform information
            try {
              const platform = Capacitor.getPlatform(); // Gets 'ios', 'android', or 'web'
              const { publicKey, authToken } = generateWebPushKeys();
              
              await axios.post('/api/fcm/register', { 
                token,
                platform: platform,
                device_id: 'capacitor_' + Date.now(),
                public_key: publicKey,
                auth_token: authToken
              });
              console.log('FCM token registered with server for platform:', platform);
              console.log('Web push keys generated and registered');
            } catch (error) {
              console.error('Error registering FCM token with server:', error);
            }
          } catch (error) {
            console.error('Error getting FCM token:', error);
          }
          
          // Listen for incoming push notifications (calls)
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('📱 [CallManager] 📩 ===== PUSH NOTIFICATION RECEIVED =====');
            console.log('📱 [CallManager] 📩 Full notification object:', JSON.stringify(notification, null, 2));
            console.log('📱 [CallManager] 📊 Notification data type:', notification.data?.type);
            console.log('📱 [CallManager] 🎯 TriggerCallKit flag:', notification.data?.triggerCallKit);
            console.log('📱 [CallManager] 🔍 All notification data keys:', Object.keys(notification.data || {}));
            
            // Handle different types of call notifications
            const isCallNotification = notification.data?.type === 'call' || 
                                      notification.data?.type === 'ios_call' || 
                                      notification.data?.triggerCallKit === 'true' ||
                                      notification.data?.triggerCallKit === true;
            
            console.log('📱 [CallManager] 🔍 Is call notification?', isCallNotification);
            
            if (isCallNotification) {
              console.log('📞 [CallManager] 🎉 ===== CALL NOTIFICATION DETECTED =====');
              console.log('📞 [CallManager] 📋 Extracting call data...');
              
              const extractedCallData = {
                type: notification.data.type,
                callerId: notification.data.callerId || notification.data.from || 'unknown',
                callerName: notification.data.callerName || notification.data.caller_name || 'Unknown Caller',
                callType: notification.data.callType || notification.data.call_type || 'audio',
                triggerCallKit: notification.data.triggerCallKit,
                callId: notification.data.callId || Date.now().toString()
              };
              
              console.log('📞 [CallManager] 📋 Extracted call data:', JSON.stringify(extractedCallData, null, 2));
              console.log('📞 [CallManager] 🚀 About to call handleIncomingCall...');
              
              handleIncomingCall(extractedCallData);
              
              console.log('📞 [CallManager] ✅ handleIncomingCall called successfully');
            } else {
              console.log('📱 [CallManager] ❌ ===== NOT A CALL NOTIFICATION =====');
              console.log('📱 [CallManager] 📊 Notification type was:', notification.data?.type);
              console.log('📱 [CallManager] 📊 TriggerCallKit was:', notification.data?.triggerCallKit);
              console.log('📱 [CallManager] 📊 Available data:', notification.data);
            }
            
            console.log('📱 [CallManager] 📩 ===== PUSH NOTIFICATION PROCESSING COMPLETED =====');
          });

          // Add listener for our custom CallPlugin events
          CallPlugin.addListener('callAction', (data) => {
            console.log('Received callAction event:', data);
            
            if (data.action === 'accept') {
              acceptCall(data);
            } else if (data.action === 'reject' || data.action === 'decline') {
              declineCall(data);
            }
          });
          
          console.log('Call notification listeners set up successfully');
        } catch (error) {
          console.error('Error setting up call notifications:', error);
        }
      } else {
        // Web fallback
        console.log('Setting up web notification listeners for calls');
        
        // Request notification permission
        try {
          if ('Notification' in window) {
            await Notification.requestPermission();
          }
        } catch (error) {
          console.error('Error requesting notification permissions:', error);
        }
      }
      
      // Add custom event listener for direct navigation from native code
      const handleCapacitorReceiveCall = (event) => {
        console.log('Received capacitor-receive-call event:', event.detail);
        
        if (event.detail && event.detail.route) {
          console.log('Navigating to route from native event:', event.detail.route);
          
          // Use router to navigate to the specified route
          router.visit(event.detail.route, { 
            preserveState: true,
            preserveScroll: true,
            replace: false
          });
          
          // If we have call data, update call state
          if (event.detail.callId) {
            setCallState(prev => ({
              ...prev,
              isIncomingCall: false,
              isOngoingCall: true,
              callerId: event.detail.callerId,
              callerName: event.detail.callerName,
              callType: event.detail.callType || 'audio',
              callStartTime: new Date(),
              callId: event.detail.callId,
              callStatus: 'connected'
            }));
          }
        }
      };
      
      window.addEventListener('capacitor-receive-call', handleCapacitorReceiveCall);
      
      // Clean up listeners when component unmounts
      return () => {
        if (Capacitor.isNativePlatform()) {
          PushNotifications.removeAllListeners();
          CallPlugin.removeAllListeners();
        }
        
        // Remove custom event listener with the same reference
        window.removeEventListener('capacitor-receive-call', handleCapacitorReceiveCall);
      };
    };

    setupCallListeners();
    
    // Clean up listeners when component unmounts
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
        CallPlugin.removeAllListeners();
      }
      
      // Remove custom event listener
      window.removeEventListener('capacitor-receive-call', () => {
        console.log('Removed capacitor-receive-call event listener');
      });
    };
  }, []);

  // Handle an incoming call
  const handleIncomingCall = (callData) => {
    console.log('📞 [CallManager] 🎯 ===== HANDLE INCOMING CALL STARTED =====');
    console.log('📞 [CallManager] 📥 Input call data:', JSON.stringify(callData, null, 2));
    
    try {
      // Extract call information with fallbacks
      const callInfo = {
        callerId: callData.callerId || callData.from || 'unknown',
        callerName: callData.callerName || callData.caller_name || 'Unknown Caller',
        callType: callData.callType || callData.call_type || 'audio',
        callId: callData.callId || callData.call_id || Date.now().toString()
      };
      
      console.log('📞 [CallManager] 🔧 Processed call info:', JSON.stringify(callInfo, null, 2));
      
      // Update call state
      console.log('📞 [CallManager] 📝 Updating call state...');
      setCallState({
        isIncomingCall: true,
        callerId: callInfo.callerId,
        callerName: callInfo.callerName,
        callType: callInfo.callType,
        callStartTime: new Date(),
        callId: callInfo.callId,
        callStatus: 'ringing'
      });
      console.log('📞 [CallManager] ✅ Call state updated successfully');

      // Show call notification - this should trigger CallKit on iOS
      console.log('📞 [CallManager] 🎯 About to call showCallNotification...');
      console.log('📞 [CallManager] 📋 Passing call info to showCallNotification:', JSON.stringify(callInfo, null, 2));
      
      showCallNotification(callInfo).then((result) => {
        console.log('📞 [CallManager] ✅ showCallNotification completed with result:', result);
      }).catch((error) => {
        console.error('📞 [CallManager] ❌ showCallNotification failed with error:', error);
      });

      // Play ringtone (fallback for non-CallKit scenarios)
      console.log('📞 [CallManager] 🔊 Starting ringtone as fallback...');
      const ringtoneAudio = playRingtone();
      console.log('📞 [CallManager] 🔊 Ringtone started:', ringtoneAudio ? 'Success' : 'Failed');
      
      console.log('📞 [CallManager] 🎯 ===== HANDLE INCOMING CALL COMPLETED =====');
      
    } catch (error) {
      console.error('📞 [CallManager] ❌ ===== ERROR IN HANDLE INCOMING CALL =====');
      console.error('📞 [CallManager] ❌ Error:', error);
      console.error('📞 [CallManager] ❌ Call data was:', JSON.stringify(callData, null, 2));
      
      toast.error(`❌ Failed to handle incoming call: ${error.message}`, {
        duration: 5000,
        position: 'top-center'
      });
      
      console.error('📞 [CallManager] ❌ ===== ERROR HANDLING COMPLETED =====');
    }
  };

  // Play ringtone for incoming calls
  const playRingtone = () => {
    try {
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.play().then(() => {
        console.log('📞 [CallManager] ✅ Ringtone started successfully');
      }).catch(error => {
        console.error('📞 [CallManager] ❌ Error playing ringtone:', error);
      });
      return audio;
    } catch (error) {
      console.error('📞 [CallManager] ❌ Error creating ringtone audio:', error);
      return null;
    }
  };

  // Show WhatsApp-like call notification
  const showCallNotification = async (callData) => {
    console.log('📞 [CallManager] 🔔 ===== SHOW CALL NOTIFICATION STARTED =====');
    console.log('📞 [CallManager] 📥 Input callData:', JSON.stringify(callData, null, 2));
    
    try {
      // Check if we're on iOS and CallKit is available
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();
      
      console.log('📞 [CallManager] 🔍 Platform check:', { platform, isNative });
      console.log('📞 [CallManager] 🔍 Capacitor plugins available:', Object.keys(Capacitor.Plugins || {}));
      
      if (platform === 'ios' && isNative) {
        console.log('📞 [CallManager] 🎉 iOS detected - triggering native CallKit interface!');
        
        // Use our centralized callPluginManager instead of direct CallPlugin
        console.log('📞 [CallManager] 🔌 Getting plugin from callPluginManager...');
        
        // Import callPluginManager
        const { callPluginManager } = await import('../../utils/iOSSimpleCall');
        console.log('📞 [CallManager] ✅ callPluginManager imported successfully');
        
        const plugin = callPluginManager.getPlugin();
        console.log('📞 [CallManager] 🔌 Plugin obtained:', plugin ? 'Success' : 'Failed');
        console.log('📞 [CallManager] 🔌 Plugin methods:', plugin ? Object.keys(plugin) : 'No plugin');
        
        if (!plugin) {
          throw new Error('CallPlugin not available from callPluginManager');
        }

        console.log('📞 [CallManager] 🎯 About to call plugin.startCall with:');
        const startCallParams = {
          callerId: callData.callerId,
          callerName: callData.callerName,
          callType: callData.callType || 'audio'
        };
        console.log('📞 [CallManager] 📋 StartCall params:', JSON.stringify(startCallParams, null, 2));

        console.log('📞 [CallManager] 🚀 Calling plugin.startCall...');
        const result = await plugin.startCall(startCallParams);
        
        console.log('📞 [CallManager] 🎉 NATIVE iOS CALLKIT TRIGGERED SUCCESSFULLY!');
        console.log('📞 [CallManager] ✅ CallKit result:', JSON.stringify(result, null, 2));
        
        // Show success toast
        toast.success(`🎉 Native iOS CallKit shown for ${callData.callerName}!`, {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#10b981',
            color: 'white',
            fontSize: '16px',
          },
        });
        
        console.log('📞 [CallManager] 🔔 ===== SHOW CALL NOTIFICATION COMPLETED SUCCESSFULLY =====');
        return result;
        
      } else {
        console.log('📞 [CallManager] ⚠️ Not iOS or not native - using fallback notification');
        console.log('📞 [CallManager] 📊 Platform details:', { platform, isNative });
        
        // Fallback for non-iOS platforms
        toast.success(`📞 Incoming call from ${callData.callerName}`, {
          duration: 10000,
          position: 'top-center',
          style: {
            background: '#059669',
            color: 'white',
            fontSize: '16px',
          },
        });
        
        console.log('📞 [CallManager] 🔔 ===== SHOW CALL NOTIFICATION COMPLETED (FALLBACK) =====');
        return { success: false, reason: 'not-ios-native' };
      }
    } catch (error) {
      console.error('📞 [CallManager] ❌ ===== ERROR IN SHOW CALL NOTIFICATION =====');
      console.error('📞 [CallManager] ❌ Error object:', error);
      console.error('📞 [CallManager] ❌ Error message:', error.message);
      console.error('📞 [CallManager] ❌ Error stack:', error.stack);
      console.error('📞 [CallManager] ❌ Error name:', error.name);
      console.error('📞 [CallManager] ❌ CallData was:', JSON.stringify(callData, null, 2));
      
      // Show error toast with detailed info
      toast.error(`❌ CallKit failed: ${error.message}`, {
        duration: 8000,
        position: 'top-center',
        style: {
          background: '#dc2626',
          color: 'white',
          fontSize: '14px',
        },
      });
      
      console.error('📞 [CallManager] ❌ ===== ERROR HANDLING COMPLETED =====');
      throw error;
    }
  };

  // Accept incoming call
  const acceptCall = (callData) => {
    console.log('Call accepted:', callData);
    
    // Update call state
    setCallState(prev => ({
      ...prev,
      isIncomingCall: false,
      isOngoingCall: true,
      callStatus: 'connected'
    }));
    
    // Notify the server about call acceptance
    axios.post('/api/calls/accept', {
      callId: callData?.callId,
      callerId: callData?.callerId,
    }).catch(err => console.error('Error notifying server about call acceptance:', err));
    
    // Navigate to the call screen
    const callParams = {
      type: callData?.callType || 'audio',
      caller: callData?.callerName
    };
    
    if (callData?.callerId) {
      callParams.recipient = callData.callerId;
    }
    
    router.visit(`/call/${callData?.callId || Date.now()}`, { 
      preserveState: true,
      preserveScroll: true,
      replace: false,
      query: callParams
    });
  };

  // Decline incoming call
  const declineCall = (callData) => {
    console.log('Call declined:', callData);
    
    // Reset call state
    setCallState({
      isIncomingCall: false,
      isOngoingCall: false,
      callerId: null,
      callerName: null,
      callType: 'audio',
      callStartTime: null,
      callId: null,
      callStatus: 'idle'
    });
    
    // Notify the server about call rejection
    axios.post('/api/calls/reject', {
      callId: callData?.callId,
      callerId: callData?.callerId,
    }).catch(err => console.error('Error notifying server about call rejection:', err));
  };

  // Initiate a new call
  const initiateCall = async (recipientId, callType = 'audio') => {
    try {
      // Generate a unique call ID
      const callId = Date.now().toString();
      
      // Update call state
      setCallState({
        isIncomingCall: false,
        isOngoingCall: true,
        callerId: recipientId,
        callType,
        callStartTime: new Date(),
        callId,
        callStatus: 'connecting'
      });
      
      // Notify the server about the new call
      const response = await axios.post('/api/calls/initiate', {
        recipientId,
        callType,
        callId
      });
      
      // Navigate to call screen
      router.visit(`/call/${callId}`, {
        preserveState: true,
        preserveScroll: true,
        replace: false,
        query: {
          type: callType,
          recipient: recipientId
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to initiate call');
      return null;
    }
  };

  // End an ongoing call
  const endCall = async (callId) => {
    try {
      // Update call state
      setCallState(prev => ({
        ...prev,
        isOngoingCall: false,
        callStatus: 'ended'
      }));
      
      // Notify the server about call ending
      await axios.post('/api/calls/end', { callId });
      
      return true;
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
      return false;
    }
  };

  return (
    <CallContext.Provider value={{
      ...callState,
      initiateCall,
      endCall,
      acceptCall,
      declineCall
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const CallManager = () => {
  const registerWithFCM = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const { token } = await FCM.getToken();
        const platform = Capacitor.getPlatform(); // Gets 'ios', 'android', or 'web'
        
        // Generate keys for web push format (aes128gcm)
        const generateWebPushKeys = () => {
          // Generate random keys for aes128gcm format
          const publicKey = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(65))));
          const authToken = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
          return { publicKey, authToken };
        };
        
        const { publicKey, authToken } = generateWebPushKeys();
        
        await axios.post('/api/fcm/register', { 
          token,
          platform: platform,
          device_id: 'capacitor_' + Date.now(),
          public_key: publicKey,
          auth_token: authToken
        });
        console.log('FCM token registered successfully for platform:', platform);
        console.log('Web push keys generated and registered');
      }
    } catch (error) {
      console.error('Error registering with FCM:', error);
    }
  };

  useEffect(() => {
    registerWithFCM();
  }, []);

  return null;
};

export default CallManager;