import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import callKitManager from './CallKitManager.js';
import axios from 'axios';

const CallButton = ({ 
    contactName = 'Unknown Caller', 
    phoneNumber = '+1234567890',
    isIncoming = false,
    className = '',
    variant = 'primary' // primary, secondary, incoming, outgoing
}) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [callStatus, setCallStatus] = useState('idle'); // idle, calling, connected, ended
    const [platform, setPlatform] = useState('web');
    const [currentCall, setCurrentCall] = useState(null);

    useEffect(() => {
        // Detect platform
        if (Capacitor.isNativePlatform()) {
            setPlatform(Capacitor.getPlatform());
        }

        // Listen for call events
        if (callKitManager.isAvailable()) {
            callKitManager.on('callStarted', handleCallStarted);
            callKitManager.on('callAnswered', handleCallAnswered);
            callKitManager.on('callEnded', handleCallEnded);
        }

        return () => {
            if (callKitManager.isAvailable()) {
                callKitManager.off('callStarted', handleCallStarted);
                callKitManager.off('callAnswered', handleCallAnswered);
                callKitManager.off('callEnded', handleCallEnded);
            }
        };
    }, []);

    const handleCallStarted = (data) => {
        setIsCallActive(true);
        setCallStatus('calling');
        setCurrentCall(data);
    };

    const handleCallAnswered = (data) => {
        setCallStatus('connected');
    };

    const handleCallEnded = (data) => {
        setIsCallActive(false);
        setCallStatus('ended');
        setCurrentCall(null);
        
        // Reset to idle after a brief delay
        setTimeout(() => {
            setCallStatus('idle');
        }, 2000);
    };

    const startCall = async () => {
        console.log(`Starting call to ${contactName} (${phoneNumber}) on ${platform}`);

        if (platform === 'ios') {
            // iOS - Use native CallKit
            const success = await callKitManager.startOutgoingCall(phoneNumber, contactName);
            if (success) {
                setCallStatus('calling');
                
                // Also notify other devices about the call
                await notifyOtherDevices('outgoing_call');
            }
        } else if (platform === 'android') {
            // Android - Show custom call interface
            setIsCallActive(true);
            setCallStatus('calling');
            
            // Notify other devices
            await notifyOtherDevices('outgoing_call');
            
            // For Android, you could integrate with your WebRTC or other calling solution
            showAndroidCallInterface();
        } else {
            // Desktop/Web - Show web call interface
            setIsCallActive(true);
            setCallStatus('calling');
            
            // Notify mobile devices about desktop call
            await notifyOtherDevices('desktop_call');
            
            showWebCallInterface();
        }
    };

    const answerCall = async () => {
        if (platform === 'ios' && currentCall) {
            // iOS CallKit will handle this automatically
            setCallStatus('connected');
        } else {
            // Handle answer for other platforms
            setCallStatus('connected');
            await notifyOtherDevices('call_answered');
        }
    };

    const endCall = async () => {
        if (platform === 'ios') {
            await callKitManager.endCall();
        } else {
            setIsCallActive(false);
            setCallStatus('ended');
            setCurrentCall(null);
        }
        
        // Notify other devices
        await notifyOtherDevices('call_ended');
    };

    const notifyOtherDevices = async (action) => {
        try {
            await axios.post('/api/calls/notify', {
                caller_name: contactName,
                caller_number: phoneNumber,
                action: action,
                platform: platform,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to notify other devices:', error);
        }
    };

    const showAndroidCallInterface = () => {
        // For Android, you could show a full-screen call activity
        // This would integrate with your existing call UI
        console.log('Showing Android call interface');
    };

    const showWebCallInterface = () => {
        // For web/desktop, show a modal or redirect to call page
        console.log('Showing web call interface');
        window.open(`/call?contact=${encodeURIComponent(contactName)}&number=${encodeURIComponent(phoneNumber)}`, '_blank');
    };

    const getButtonText = () => {
        switch (callStatus) {
            case 'calling':
                return 'Calling...';
            case 'connected':
                return 'End Call';
            case 'ended':
                return 'Call Ended';
            default:
                return isIncoming ? 'Answer' : `Call ${contactName}`;
        }
    };

    const getButtonIcon = () => {
        switch (callStatus) {
            case 'calling':
                return '📞';
            case 'connected':
                return '📴';
            case 'ended':
                return '✅';
            default:
                return isIncoming ? '📲' : '📞';
        }
    };

    const getButtonColor = () => {
        switch (callStatus) {
            case 'calling':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'connected':
                return 'bg-red-500 hover:bg-red-600';
            case 'ended':
                return 'bg-gray-500';
            default:
                if (isIncoming) {
                    return 'bg-green-500 hover:bg-green-600';
                }
                return variant === 'primary' 
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-500 hover:bg-gray-600';
        }
    };

    const handleClick = () => {
        switch (callStatus) {
            case 'idle':
                if (isIncoming) {
                    answerCall();
                } else {
                    startCall();
                }
                break;
            case 'calling':
            case 'connected':
                endCall();
                break;
            case 'ended':
                // Do nothing, button is disabled
                break;
        }
    };

    return (
        <div className={`call-button-container ${className}`}>
            <button
                onClick={handleClick}
                disabled={callStatus === 'ended'}
                className={`
                    call-button
                    ${getButtonColor()}
                    text-white font-semibold py-3 px-6 rounded-lg
                    flex items-center space-x-2
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-lg hover:shadow-xl
                    transform hover:scale-105
                `}
            >
                <span className="text-xl">{getButtonIcon()}</span>
                <span>{getButtonText()}</span>
            </button>
            
            {/* Platform indicator */}
            <div className="text-xs text-gray-500 mt-1 text-center">
                {platform === 'ios' && '📱 iOS CallKit'}
                {platform === 'android' && '🤖 Android'}
                {platform === 'web' && '🖥️ Desktop'}
            </div>
            
            {/* Call status indicator */}
            {isCallActive && (
                <div className="call-status-indicator mt-2 p-2 bg-gray-100 rounded text-center">
                    <div className="flex items-center justify-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                            callStatus === 'calling' ? 'bg-yellow-500 animate-pulse' :
                            callStatus === 'connected' ? 'bg-green-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm text-gray-700">
                            {callStatus === 'calling' && 'Connecting...'}
                            {callStatus === 'connected' && 'Call Active'}
                            {callStatus === 'ended' && 'Call Ended'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallButton; 