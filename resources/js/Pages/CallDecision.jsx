import React from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { motion } from 'framer-motion';

const CallDecision = ({ callId, callType, recipientId, callerName }) => {
  // Handle accepting the call
  const acceptCall = () => {
    // Navigate to the actual call screen
    router.visit(`/call/${callId}`, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
      query: {
        type: callType,
        caller: callerName,
        recipient: recipientId
      }
    });
  };
  
  // Handle declining the call
  const declineCall = async () => {
    try {
      // Notify the server that the call was rejected
      await fetch('/api/calls/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callId,
          callerId: recipientId
        })
      });
      
      // Go back to the previous page
      router.visit('/workflows', {
        preserveState: false,
        preserveScroll: false,
        replace: true
      });
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  };

  return (
    <>
      <Head title={`Incoming ${callType === 'video' ? 'Video' : 'Voice'} Call`} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 to-gray-800 text-white"
      >
        {/* Header area */}
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-6">
              <User size={60} />
            </div>
            <h1 className="text-3xl font-bold">{callerName || 'Unknown Caller'}</h1>
            <p className="mt-3 text-gray-300">
              Incoming {callType === 'video' ? 'Video' : 'Voice'} Call
            </p>
          </motion.div>
        </div>
        
        {/* Call controls */}
        <div className="w-full pb-20 pt-8 flex justify-center space-x-16">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={declineCall}
            className="h-20 w-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg"
          >
            <PhoneOff size={36} />
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={acceptCall}
            className="h-20 w-20 bg-green-600 rounded-full flex items-center justify-center shadow-lg"
          >
            <Phone size={36} />
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

export default CallDecision;