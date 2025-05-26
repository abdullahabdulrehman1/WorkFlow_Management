import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import WorkflowLayout from '../components/layout/WorkflowLayout';
import useIsMobile from '../hooks/useIsMobile';
import { Capacitor } from '@capacitor/core';

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

// Enhanced web fallback implementation with better console logging
const CallPluginWeb = {
  startCall: async ({ callerId, callerName, callType }) => {
    console.log('[CallPluginWeb] Web fallback for startCall', { callerId, callerName, callType });
    
    // If we're on a mobile device, try to use direct tel: or facetime: protocol
    if (isNativeEnvironment()) {
      console.log('[CallPluginWeb] Attempting direct protocol call on mobile');
      try {
        // Format a dummy phone number for testing
        const phoneNumber = '+12345678900';
        
        // Choose appropriate URL scheme based on call type
        const scheme = callType === 'video' ? 'facetime:' : 'tel:';
        const url = scheme + phoneNumber;
        
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
        
        return { callId: Date.now().toString(), success: true, directProtocol: true };
      } catch (err) {
        console.error('[CallPluginWeb] Direct protocol call failed:', err);
        // Continue with web fallback if direct call fails
      }
    }
    
    // Web fallback implementation
    return { callId: Date.now().toString(), success: true };
  },
  endCall: async () => {
    console.log('[CallPluginWeb] Web fallback for endCall');
    return { success: true };
  }
};

// Get the appropriate CallPlugin implementation
const getCallPlugin = () => {
  try {
    // Check if native plugin is available
    if (isNativeEnvironment() && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CallPlugin) {
      console.log('[CallTest] Using native CallPlugin');
      return window.Capacitor.Plugins.CallPlugin;
    }
    
    // Try native plugin through dynamic import (alternative registration)
    if (isNativeEnvironment() && window.Capacitor) {
      try {
        const { registerPlugin } = require('@capacitor/core');
        const nativePlugin = registerPlugin('CallPlugin');
        console.log('[CallTest] Registered native CallPlugin dynamically');
        return nativePlugin;
      } catch (err) {
        console.warn('[CallTest] Failed to register native plugin:', err);
      }
    }
    
    console.log('[CallTest] Using web fallback for CallPlugin');
    return CallPluginWeb;
  } catch (err) {
    console.error('[CallTest] Error setting up CallPlugin:', err);
    return CallPluginWeb;
  }
};

// Get the appropriate plugin implementation
const CallPlugin = getCallPlugin();

const CallTest = () => {
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

  useEffect(() => {
    // Check if we're running on a native platform with Capacitor
    const checkCapacitor = async () => {
      try {
        // Enhanced plugin detection
        const isNative = Capacitor.isNativePlatform();
        const platform = Capacitor.getPlatform();
        
        setDebugInfo(`Platform: ${platform}, Native: ${isNative ? 'Yes' : 'No'}`);
        
        if (isNative) {
          console.log("[CallTest] Running on native platform:", platform);
          
          // Test if plugin is available
          try {
            console.log("[CallTest] Testing CallPlugin availability...");
            await CallPlugin.endCall();
            setIsCapacitorAvailable(true);
            setDebugInfo(prev => `${prev}\nCallPlugin detected and working!`);
            console.log("[CallTest] CallPlugin is registered and available");
          } catch (err) {
            console.error("[CallTest] Error testing CallPlugin:", err);
            setDebugInfo(prev => `${prev}\nError with CallPlugin: ${err.message}`);
            setIsCapacitorAvailable(false);
          }
        } else {
          console.log("[CallTest] Running in web mode - will use web fallback");
          setIsCapacitorAvailable(false);
          setDebugInfo(prev => `${prev}\nRunning in web mode - using fallback`);
        }
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
      setDebugInfo(prev => `${prev}\nAttempting to start call...`);
      
      console.log("[CallTest] Initiating test call with:", { callerId, callerName, callType });
      
      // Use the plugin regardless of platform - the fallback will handle web case
      const result = await CallPlugin.startCall({
        callerId,
        callerName,
        callType
      });
      
      toast.success(`Call initiated with ID: ${result.callId}`);
      setDebugInfo(prev => `${prev}\nCall started successfully with ID: ${result.callId}`);
      console.log("[CallTest] Call started:", result);
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
      
      // Use the plugin regardless of platform - the fallback will handle web case
      const result = await CallPlugin.endCall();
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

  return (
    <WorkflowLayout breadcrumbText="Call Testing">
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Call Testing Interface</h2>
        
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
              <div className="w-12 text-center font-medium">{delaySeconds}s</div>
            </div>
          </div>
          
          {/* Timer display when active */}
          {isTimerRunning && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{currentCountdown}</div>
              <div className="text-sm text-blue-600">Seconds until call notification</div>
              <button
                onClick={cancelTimer}
                className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
          
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
        
        <div className="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Testing Status</h3>
          <p className="text-sm text-gray-600">
            {isCapacitorAvailable ? (
              <span className="text-green-600 font-medium">✓ CallPlugin detected - Native call testing available</span>
            ) : (
              <span className="text-amber-600 font-medium">⚠ Running in web mode or plugin not available</span>
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