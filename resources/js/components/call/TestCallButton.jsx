import React, { useState } from 'react';
import { useCall } from './CallManager';

const TestCallButton = ({ recipientId = '1', callType = 'audio' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const callManager = useCall();
  
  const handleCall = async () => {
    setIsLoading(true);
    try {
      // Initiate call using our call manager
      const result = await callManager.initiateCall(recipientId, callType);
      
      if (!result.success) {
        console.error('Call failed:', result.error);
        alert(`Call failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error making call:', error);
      alert(`Error making call: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <button
      onClick={handleCall}
      disabled={isLoading}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      {isLoading ? 'Calling...' : `Start ${callType} Call`}
    </button>
  );
};

export default TestCallButton;