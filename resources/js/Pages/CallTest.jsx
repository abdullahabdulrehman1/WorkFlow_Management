import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import WorkflowLayout from '../components/layout/WorkflowLayout';
import useIsMobile from '../hooks/useIsMobile';
import { Capacitor, registerPlugin } from '@capacitor/core';

// Improved web fallback implementation with better console logging
const CallPluginWeb = {
  startCall: async ({ callerId, callerName, callType }) => {
    console.log('[CallPluginWeb] Web fallback for startCall', { callerId, callerName, callType });
    return { callId: Date.now().toString(), success: true };
  },
  endCall: async () => {
    console.log('[CallPluginWeb] Web fallback for endCall');
    return { success: true };
  }
};

// Register the plugin with proper fallback
const CallPlugin = Capacitor.isNativePlatform() 
  ? registerPlugin('CallPlugin') 
  : CallPluginWeb;

const CallTest = () => {
  const [callerId, setCallerId] = useState('test-user-123');
  const [callerName, setCallerName] = useState('Test Caller');
  const [callType, setCallType] = useState('audio');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const isMobile = useIsMobile();
  const [isCapacitorAvailable, setIsCapacitorAvailable] = useState(false);

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

  const initiateCall = async () => {
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
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Caller Name</label>
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Call Type</label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="audio">Audio Call</option>
              <option value="video">Video Call</option>
            </select>
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              onClick={initiateCall}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Initiating...' : 'Start Test Call'}
            </button>
            
            <button
              onClick={endCall}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
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