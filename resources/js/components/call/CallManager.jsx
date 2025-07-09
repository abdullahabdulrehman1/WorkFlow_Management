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
            console.log('Push notification received', notification);
            
            if (notification.data?.type === 'call') {
              handleIncomingCall(notification.data);
            }
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
    console.log('Incoming call data:', callData);
    
    // Update call state
    setCallState({
      isIncomingCall: true,
      callerId: callData.callerId || callData.from,
      callerName: callData.callerName || 'Unknown Caller',
      callType: callData.callType || 'audio',
      callStartTime: new Date(),
      callId: callData.callId || Date.now().toString(),
      callStatus: 'ringing'
    });

    // Show call notification
    showCallNotification(callData);

    // Play ringtone
    playRingtone();
  };

  // Play ringtone for incoming calls
  const playRingtone = () => {
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(error => {
      console.error('Error playing ringtone:', error);
    });
    return audio;
  };

  // Show WhatsApp-like call notification
  const showCallNotification = async (callData) => {
    try {
      // Use our native CallPlugin for call notifications
      await CallPlugin.startCall({
        callerId: callData.callerId || callData.from,
        callerName: callData.callerName || 'Unknown Caller',
        callType: callData.callType || 'audio'
      });
    } catch (error) {
      console.error('Error showing call notification:', error);
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