import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import WorkflowLayout from '../components/layout/WorkflowLayout';
import useIsMobile from '../hooks/useIsMobile';
import { Capacitor } from '@capacitor/core';
import NotificationTest from '../components/NotificationTest';
import { callPluginManager } from '../utils/iOSSimpleCall'; // Import the centralized manager
import axios from 'axios';
import { usePage } from '@inertiajs/react';

// Improved detection of native environment
const isNativeEnvironment = () => {
  // Check if Capacitor is available and we're on a native platform
  const isCapacitorNative = typeof window !== 'undefined' && 
                            window.Capacitor !== undefined && 
                            Capacitor.isNativePlatform && 
                            Capacitor.isNativePlatform();
  
  // Check if Cordova is available as fallback
  const isCordova = typeof window !== 'undefined' && window.cordova !== undefined;
  
  // Use user agent detection as last resort
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  console.log('[CallTest] Environment detection:', { 
    isCapacitorNative, 
    isCordova,
    isMobileUA,
    platform: Capacitor.getPlatform ? Capacitor.getPlatform() : 'unknown'
  });
  
  return isCapacitorNative || isCordova || isMobileUA;
};

const CallTest = () => {
  const { csrf_token } = usePage().props;
  const [callerId, setCallerId] = useState('test-user-123');
  const [callerName, setCallerName] = useState('Test Caller');
  const [callType, setCallType] = useState('audio');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const isMobile = useIsMobile();
  const [isCapacitorAvailable, setIsCapacitorAvailable] = useState(false);
  
  // Timer related states
  const [delaySeconds, setDelaySeconds] = useState(5);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentCountdown, setCurrentCountdown] = useState(0);

  // FCM Debug states
  const [fcmDebugLoading, setFcmDebugLoading] = useState(false);
  const [fcmDebugResult, setFcmDebugResult] = useState(null);

  useEffect(() => {
    // Check if we're running on a native platform with Capacitor
    const checkCapacitor = async () => {
      try {
        // Enhanced plugin detection
        const isNative = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform();
        
        let debugText = `Platform: ${platform}, Native: ${isNative ? 'Yes' : 'No'}`;
        
        // Check if CallPluginManager is properly initialized
        const isCallKitAvailable = callPluginManager.isNativeCallKit();
        const isPluginAvailable = callPluginManager.isAvailable();
        
        if (isNative && platform === 'ios') {
          if (isCallKitAvailable) {
            debugText += '\n✅ iOS detected - Native CallKit ready!';
            debugText += '\n📞 Tap call button to see native iOS call screen';
            setIsCapacitorAvailable(true);
          } else {
            debugText += '\n⚠️ iOS detected but CallKit not available';
            debugText += '\n🔧 Will use web fallback';
            setIsCapacitorAvailable(false);
          }
        } else if (isNative && platform === 'android') {
          debugText += '\n✅ Android detected - native plugin available';
          setIsCapacitorAvailable(isPluginAvailable);
        } else {
          debugText += '\n⚠️ Web platform - using fallback methods';
          setIsCapacitorAvailable(false);
        }
        
        debugText += `\n🔧 Plugin Manager Status: ${isPluginAvailable ? 'Ready' : 'Not Ready'}`;
        debugText += `\n📱 CallKit Available: ${isCallKitAvailable ? 'Yes' : 'No'}`;
        
        setDebugInfo(debugText);
        
        console.log("[CallTest] Plugin manager status:", {
          platform,
          isNative,
          isCallKitAvailable,
          isPluginAvailable,
          pluginManager: callPluginManager
        });
        
      } catch (error) {
        console.error("[CallTest] Error in Capacitor detection:", error);
        setDebugInfo(prev => `${prev}\nError: ${error.message}`);
        setIsCapacitorAvailable(false);
      }
    };
    
    checkCapacitor();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    let interval;
    
    if (isTimerRunning && currentCountdown > 0) {
      interval = setInterval(() => {
        setCurrentCountdown(prevCount => {
          const newCount = prevCount - 1;
          
          // When countdown reaches 0, initiate the call
          if (newCount === 0) {
            initiateCallNow();
          }
          
          return newCount;
        });
      }, 1000);
    } else if (currentCountdown === 0) {
      setIsTimerRunning(false);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, currentCountdown]);

  // Start the delayed call
  const startDelayedCall = () => {
    if (delaySeconds > 0) {
      toast.success(`Starting call in ${delaySeconds} seconds. You can switch apps now!`);
      setDebugInfo(prev => `${prev}\nStarting call timer for ${delaySeconds} seconds...`);
      setCurrentCountdown(delaySeconds);
      setIsTimerRunning(true);
    } else {
      // If delay is set to 0, start call immediately
      initiateCallNow();
    }
  };

  // Actual call initiation logic (without delay)
  const initiateCallNow = async () => {
    try {
      setIsLoading(true);
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();
      const isCallKitAvailable = callPluginManager.isNativeCallKit();
      
      if (isNative && platform === 'ios' && isCallKitAvailable) {
        setDebugInfo(prev => `${prev}\n📞 Triggering native iOS CallKit interface...`);
        toast.info('🎉 Showing native iOS CallKit screen!');
      } else {
        setDebugInfo(prev => `${prev}\nUsing fallback method (${platform} platform)...`);
        toast.info('Using fallback call method');
      }
      
      console.log("[CallTest] Initiating test call with:", { 
        callerId, 
        callerName, 
        callType, 
        platform, 
        isNative,
        isCallKitAvailable
      });
      
      // Use the centralized plugin manager
      const plugin = callPluginManager.getPlugin();
      const result = await plugin.startCall({
        callerId,
        callerName,
        callType
      });
      
      if (isCallKitAvailable) {
        toast.success(`🎉 Native iOS CallKit interface shown!`);
        setDebugInfo(prev => `${prev}\n✅ Native iOS CallKit displayed successfully!`);
        setDebugInfo(prev => `${prev}\nCall ID: ${result.callId || 'N/A'}`);
        setDebugInfo(prev => `${prev}\nPlatform: ${result.platform || 'ios-callkit'}`);
      } else {
        toast.success(`Call initiated: ${result.message || result.platform}`);
        setDebugInfo(prev => `${prev}\nCall started with fallback method`);
        setDebugInfo(prev => `${prev}\nCall ID: ${result.callId}`);
        setDebugInfo(prev => `${prev}\nPlatform: ${result.platform}`);
      }
      
      console.log("[CallTest] Call result:", result);
    } catch (err) {
      console.error("[CallTest] Error starting call:", err);
      toast.error("Failed to initiate call: " + (err.message || "Unknown error"));
      setDebugInfo(prev => `${prev}\nError: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    try {
      setIsLoading(true);
      setDebugInfo(prev => `${prev}\nEnding call...`);
      
      // Use the centralized plugin manager
      const plugin = callPluginManager.getPlugin();
      const result = await plugin.endCall();
      
      toast.success("Call ended successfully");
      setDebugInfo(prev => `${prev}\nCall ended successfully`);
      console.log("[CallTest] Call ended:", result);
    } catch (err) {
      console.error("[CallTest] Error ending call:", err);
      toast.error("Failed to end call: " + (err.message || "Unknown error"));
      setDebugInfo(prev => `${prev}\nError ending call: ${err.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a running timer
  const cancelTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false);
      setCurrentCountdown(0);
      toast.error("Call timer cancelled");
      setDebugInfo(prev => `${prev}\nTimer cancelled`);
    }
  };

  // FCM Debug function to test iOS call notification
  const testFCMCallNotification = async () => {
    console.log('🔔 [CallTest] ===== FCM TEST BUTTON CLICKED =====');
    console.log('🔔 [CallTest] 📋 Test parameters:', {
      callerName,
      csrf_token: csrf_token ? 'Present' : 'Missing',
      timestamp: new Date().toISOString()
    });
    
    setFcmDebugLoading(true);
    setFcmDebugResult(null);
    
    try {
      console.log('🔔 [CallTest] 🚀 Sending FCM test request to server...');
      
      const requestData = {
        caller_name: callerName, // Use the caller name from the form
        _token: csrf_token // Include CSRF token
      };
      
      console.log('🔔 [CallTest] 📤 Request data:', JSON.stringify(requestData, null, 2));
      console.log('🔔 [CallTest] 📡 Making POST request to /api/debug/ios-call-test...');
      
      const response = await axios.post('/api/debug/ios-call-test', requestData, {
        headers: {
          'X-CSRF-TOKEN': csrf_token,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🔔 [CallTest] ✅ ===== FCM REQUEST SUCCESSFUL =====');
      console.log('🔔 [CallTest] 📥 Server response:', JSON.stringify(response.data, null, 2));
      console.log('🔔 [CallTest] 📊 Response status:', response.status);
      console.log('🔔 [CallTest] 📊 Response headers:', response.headers);
      
      setFcmDebugResult({
        success: true,
        data: response.data
      });
      
      toast.success('🎉 FCM notification sent! Check iOS device for CallKit screen.', {
        duration: 5000,
        style: {
          background: '#10b981',
          color: 'white',
          fontSize: '16px',
        },
      });
      
      console.log('🔔 [CallTest] ✅ FCM test completed successfully');
      console.log('🔔 [CallTest] 💬 Now waiting for iOS device to receive push notification...');
      console.log('🔔 [CallTest] 📱 Expected: iOS CallKit should appear with call screen');
      
    } catch (error) {
      console.error('🔔 [CallTest] ❌ ===== FCM REQUEST FAILED =====');
      console.error('🔔 [CallTest] ❌ Error object:', error);
      console.error('🔔 [CallTest] ❌ Error message:', error.message);
      console.error('🔔 [CallTest] ❌ Error response:', error.response?.data);
      console.error('🔔 [CallTest] ❌ Error status:', error.response?.status);
      console.error('🔔 [CallTest] ❌ Error headers:', error.response?.headers);
      
      const errorData = error.response?.data || { error: error.message };
      
      setFcmDebugResult({
        success: false,
        error: errorData
      });
      
      toast.error(`❌ FCM test failed: ${errorData.error || errorData.message || 'Unknown error'}`, {
        duration: 8000,
        style: {
          background: '#dc2626',
          color: 'white',
          fontSize: '14px',
        },
      });
      
      console.error('🔔 [CallTest] ❌ FCM test failed with error:', errorData);
    } finally {
      setFcmDebugLoading(false);
      console.log('🔔 [CallTest] 🏁 FCM test function completed');
    }
  };

  return (
    <WorkflowLayout breadcrumbText="Call Testing">
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Call Testing Interface</h2>
        
        {/* Add Windows Notification Test */}
        <div className="mb-6">
          <NotificationTest />
        </div>

        {/* FCM Debug Test */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">FCM iOS CallKit Test</h3>
          <p className="text-sm text-blue-600 mb-4">
            Test FCM push notification to trigger iOS CallKit interface. Make sure your iOS device is registered and has the app backgrounded.
          </p>
          
          <button
            onClick={testFCMCallNotification}
            disabled={fcmDebugLoading}
            className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${fcmDebugLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {fcmDebugLoading ? 'Sending FCM...' : 'Test FCM iOS Call Notification'}
          </button>
          
          {/* FCM Debug Result Display */}
          {fcmDebugResult && (
            <div className={`mt-4 p-3 rounded-md border ${fcmDebugResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <h4 className={`text-sm font-semibold mb-2 ${fcmDebugResult.success ? 'text-green-800' : 'text-red-800'}`}>
                FCM Test Result:
              </h4>
              <pre className={`text-xs whitespace-pre-wrap overflow-auto max-h-40 ${fcmDebugResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {JSON.stringify(fcmDebugResult.success ? fcmDebugResult.data : fcmDebugResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caller ID</label>
            <input
              type="text"
              value={callerId}
              onChange={(e) => setCallerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isTimerRunning || isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caller Name</label>
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isTimerRunning || isLoading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Call Type</label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={isTimerRunning || isLoading}
            >
              <option value="audio">Audio Call</option>
              <option value="video">Video Call</option>
            </select>
          </div>
          
          {/* Delay Timer Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delay (seconds)
              <span className="ml-2 text-xs text-blue-600">
                This gives you time to switch apps before the call notification appears
              </span>
            </label>
            <div className="flex items-center">
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(parseInt(e.target.value))}
                className="w-full mr-3"
                disabled={isTimerRunning || isLoading}
              />
              <span className="text-sm font-medium text-gray-700 min-w-[3rem]">{delaySeconds}s</span>
            </div>
          </div>
          
          {/* Timer Display */}
          {isTimerRunning && (
            <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-lg font-bold text-yellow-800">
                Starting call in {currentCountdown} seconds...
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                You can switch to another app now to test background calling
              </p>
              <button
                onClick={cancelTimer}
                className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
              >
                Cancel
              </button>
            </div>
          )}
          
          {/* Call Controls */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={startDelayedCall}
              disabled={isTimerRunning || isLoading}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(isTimerRunning || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Initiating...' : `Start Call${delaySeconds > 0 ? ` (${delaySeconds}s delay)` : ''}`}
            </button>
            
            <button
              onClick={endCall}
              disabled={isTimerRunning || isLoading}
              className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${(isTimerRunning || isLoading) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              End Call
            </button>
          </div>
        </div>
        
        {/* Status and Debug Section */}
        <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Testing Status</h3>
          <p className="text-sm text-gray-600">
            {callPluginManager.isNativeCallKit() ? (
              <span className="text-green-600 font-medium">✅ Native iOS CallKit Ready!</span>
            ) : callPluginManager.isAvailable() ? (
              <span className="text-amber-600 font-medium">⚠️ Plugin available but not native CallKit</span>
            ) : (
              <span className="text-amber-600 font-medium">⚠️ Using web fallback methods</span>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {isMobile ? "Mobile view detected" : "Desktop view detected"}
          </p>
          
          {/* Debug information display */}
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md border border-gray-300">
              <h4 className="text-sm font-semibold mb-1">Debug Info:</h4>
              <pre className="text-xs whitespace-pre-wrap text-gray-700 overflow-auto max-h-32">{debugInfo}</pre>
            </div>
          )}
        </div>
      </div>
    </WorkflowLayout>
  );
};

export default CallTest;