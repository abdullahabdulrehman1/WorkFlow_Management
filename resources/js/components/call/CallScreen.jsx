import React, { useState, useEffect, useRef } from 'react';
import { useCall } from './CallManager';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { X, Mic, MicOff, Phone, Video, VideoOff, Volume2, VolumeX, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CallScreen = ({ callId, callType = 'audio', recipientId, callerName }) => {
  const callManager = useCall();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  
  const [callState, setCallState] = useState({
    status: 'connecting', // connecting, connected, ended
    isMuted: false,
    isVideoOff: callType === 'audio',
    isSpeakerOn: false,
    duration: 0,
    isMinimized: false,
    isRinging: true
  });
  
  // Set up timer for call duration
  useEffect(() => {
    let timer;
    
    if (callState.status === 'connected') {
      timer = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState.status]);
  
  // Initialize media streams
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        if (callType === 'video') {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } else {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true 
          });
          if (audioRef.current) {
            audioRef.current.srcObject = stream;
          }
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };
    
    initializeMedia();
  }, [callType]);
  
  // Connect to call
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Simulate connection delay
        setTimeout(() => {
          setCallState(prev => ({ 
            ...prev, 
            status: 'connected',
            isRinging: false 
          }));
        }, 2000);
        
        // Poll for call status
        const checkCallStatus = setInterval(async () => {
          try {
            const response = await axios.get(`/api/calls/${callId}/status`);
            if (response.data.status === 'ended') {
              endCall();
              clearInterval(checkCallStatus);
            }
          } catch (error) {
            console.error('Error checking call status:', error);
          }
        }, 5000);
        
        return () => clearInterval(checkCallStatus);
      } catch (error) {
        console.error('Error initializing call:', error);
        setCallState(prev => ({ ...prev, status: 'ended' }));
      }
    };
    
    initializeCall();
  }, [callId]);
  
  // Format duration as mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // End the call
  const endCall = async () => {
    try {
      setCallState(prev => ({ ...prev, status: 'ended' }));
      
      // Stop all media tracks
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current?.srcObject) {
        audioRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      
      // Notify call manager that call has ended
      await callManager.endCall(callId);
      
      // Navigate back after a short delay
      setTimeout(() => {
        router.visit('/workflows');
      }, 1000);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };
  
  // Toggle microphone mute
  const toggleMute = () => {
    setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (audioRef.current?.srcObject) {
      audioRef.current.srcObject.getAudioTracks().forEach(track => {
        track.enabled = !callState.isMuted;
      });
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    setCallState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getVideoTracks().forEach(track => {
        track.enabled = !callState.isVideoOff;
      });
    }
  };
  
  // Toggle speaker
  const toggleSpeaker = () => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
    if (audioRef.current) {
      audioRef.current.setSinkId(callState.isSpeakerOn ? 'default' : 'speaker');
    }
  };
  
  const toggleMinimize = () => {
    setCallState(prev => ({ ...prev, isMinimized: !prev.isMinimized }));
  };
  
  // Get caller name from props or call manager or use a default
  const displayName = callerName || callManager.callerName || recipientId || 'Unknown';
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`fixed ${callState.isMinimized ? 'bottom-4 right-4 w-64 h-64' : 'inset-0'} z-50 flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-lg shadow-2xl transition-all duration-300`}
      >
        {/* Header area */}
        <div className="w-full pt-12 pb-4 text-center">
          <motion.div
            animate={{ scale: callState.isRinging ? [1, 1.1, 1] : 1 }}
            transition={{ repeat: callState.isRinging ? Infinity : 0, duration: 1 }}
          >
            <div className="w-20 h-20 mx-auto bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <User size={40} />
            </div>
            <h1 className="text-2xl font-bold">{displayName}</h1>
            <p className="mt-2 text-gray-300">
              {callState.status === 'connecting' 
                ? 'Connecting...' 
                : callState.status === 'connected' 
                  ? formatDuration(callState.duration)
                  : 'Call ended'}
            </p>
          </motion.div>
        </div>
        
        {/* Video container */}
        {callType === 'video' && (
          <div className="flex-1 w-full max-w-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full rounded-lg ${callState.isVideoOff ? 'hidden' : ''}`}
            />
            {callState.isVideoOff && (
              <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Audio element */}
        <audio ref={audioRef} autoPlay playsInline />
        
        {/* Controls */}
        <div className="w-full pb-16 pt-8 flex justify-center space-x-6">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={toggleMute}
            className={`h-14 w-14 rounded-full flex items-center justify-center ${
              callState.isMuted ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            {callState.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={endCall}
            className="h-14 w-14 bg-red-600 rounded-full flex items-center justify-center"
          >
            <Phone size={24} className="transform rotate-135" />
          </motion.button>
          
          {callType === 'video' && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={toggleVideo}
              className={`h-14 w-14 rounded-full flex items-center justify-center ${
                callState.isVideoOff ? 'bg-red-600' : 'bg-gray-700'
              }`}
            >
              {callState.isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </motion.button>
          )}
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={toggleSpeaker}
            className={`h-14 w-14 rounded-full flex items-center justify-center ${
              callState.isSpeakerOn ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            {callState.isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </motion.button>
          
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={toggleMinimize}
            className="h-14 w-14 bg-gray-700 rounded-full flex items-center justify-center"
          >
            <X size={24} />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CallScreen;