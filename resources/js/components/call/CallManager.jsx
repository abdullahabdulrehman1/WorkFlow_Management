import React, { useState, useEffect, createContext, useContext } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';
import { FCM } from '@capacitor-community/fcm';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Register our custom plugin (defined in CallPlugin.java)
const CallPluginWeb = {
  startCall: async ({ callerId, callerName, callType }) => {
    console.log('Web fallback for startCall', { callerId, callerName, callType });
    return { callId: Date.now().toString() };
  },
  endCall: async () => {
    console.log('Web fallback for endCall');
    return { success: true };
  },
  addListener: (eventName, callback) => {
    console.log('Web fallback for addListener', eventName);
    return { remove: () => {} };
  },
  removeAllListeners: () => {
    console.log('Web fallback for removeAllListeners');
  }
};

// Check if we're in native environment and use our custom plugin, otherwise use web fallback
const CallPlugin = Capacitor.isNativePlatform() ? 
  registerPlugin('CallPlugin') : CallPluginWeb;

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

          // Register for FCM token
          if (Capacitor.getPlatform() === 'android') {
            const { token } = await FCM.getToken();
            console.log('FCM Token:', token);
            
            // Send the token to your server
            try {
              await axios.post('/api/fcm/register', { token });
              console.log('FCM token registered with server');
            } catch (error) {
              console.error('Error registering FCM token with server:', error);
            }
          }
          
          // Request permissions for local notifications
          await LocalNotifications.requestPermissions();
          
          // Listen for incoming push notifications (calls)
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push notification received', notification);
            
            if (notification.data?.type === 'call') {
              handleIncomingCall(notification.data);
            }
          });

          // Setup notification action handlers
          LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
            const { actionId, notification: notificationData } = notification;
            
            if (actionId === 'accept') {
              acceptCall(notificationData.extra);
            } else if (actionId === 'decline') {
              declineCall(notificationData.extra);
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
    };

    setupCallListeners();
    
    // Clean up listeners when component unmounts
    return () => {
      if (Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners();
        LocalNotifications.removeAllListeners();
        CallPlugin.removeAllListeners();
      }
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
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        // Use our native CallPlugin for Android
        await CallPlugin.startCall({
          callerId: callData.callerId || callData.from,
          callerName: callData.callerName || 'Unknown Caller',
          callType: callData.callType || 'audio'
        });
      } else {
        // Use local notifications as fallback
        const callId = callData.callId || Date.now().toString();
        const callType = callData.callType || 'audio';
        const callerName = callData.callerName || callData.callerId || 'Unknown';
        
        await LocalNotifications.schedule({
          notifications: [{
            id: parseInt(callId),
            title: `Incoming ${callType} Call`,
            body: `from ${callerName}`,
            sound: true,
            ongoing: true,
            autoCancel: false,
            actionTypeId: 'CALL_ACTIONS',
            extra: {
              callId,
              callerId: callData.callerId,
              callerName,
              callType
            },
            actions: [
              {
                id: 'accept',
                title: 'Accept',
                foreground: true
              },
              {
                id: 'decline',
                title: 'Decline',
                foreground: true
              }
            ]
          }]
        });
      }
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
    
    // Clear notification if using LocalNotifications
    if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android')) {
      if (callData?.callId) {
        LocalNotifications.cancel({ notifications: [{ id: parseInt(callData.callId) }] });
      }
    }
    
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
    
    // Clear notification
    if (callData?.callId) {
      LocalNotifications.cancel({ notifications: [{ id: parseInt(callData.callId) }] });
    }
    
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
      
      // Clear any existing notifications
      if (callId) {
        LocalNotifications.cancel({ notifications: [{ id: parseInt(callId) }] });
      }
      
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
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        const { token } = await FCM.getToken();
        await axios.post('/api/fcm/register', { token });
        console.log('FCM token registered successfully');
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