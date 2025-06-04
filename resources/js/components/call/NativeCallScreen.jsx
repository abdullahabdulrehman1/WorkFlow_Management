import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react';

const NativeCallScreen = ({ 
    contactName = "Unknown Contact", 
    contactNumber = "", 
    isVideoCall = false, 
    callStatus = "connecting", // connecting, ringing, connected, ended
    onEndCall,
    onToggleMute,
    onToggleVideo,
    onToggleSpeaker,
    duration = 0 
}) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(isVideoCall);
    const [isSpeakerOn, setIsSpeakerOn] = useState(false);
    const [callTime, setCallTime] = useState(duration);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Format call duration
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Update call timer
    useEffect(() => {
        let interval = null;
        if (callStatus === 'connected') {
            interval = setInterval(() => {
                setCallTime(prevTime => prevTime + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [callStatus]);

    // Initialize media streams
    useEffect(() => {
        const initializeMedia = async () => {
            try {
                if (isVideoCall && localVideoRef.current) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    localVideoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing media devices:', error);
            }
        };

        initializeMedia();
    }, [isVideoCall]);

    const handleToggleMute = () => {
        setIsMuted(!isMuted);
        onToggleMute && onToggleMute(!isMuted);
    };

    const handleToggleVideo = () => {
        setIsVideoEnabled(!isVideoEnabled);
        onToggleVideo && onToggleVideo(!isVideoEnabled);
    };

    const handleToggleSpeaker = () => {
        setIsSpeakerOn(!isSpeakerOn);
        onToggleSpeaker && onToggleSpeaker(!isSpeakerOn);
    };

    const getStatusText = () => {
        switch (callStatus) {
            case 'connecting': return 'Connecting...';
            case 'ringing': return 'Ringing...';
            case 'connected': return formatDuration(callTime);
            case 'ended': return 'Call ended';
            default: return 'Unknown';
        }
    };

    const getBackgroundColor = () => {
        if (isVideoCall && callStatus === 'connected') {
            return 'bg-black';
        }
        return 'bg-gradient-to-br from-green-400 via-green-500 to-green-600';
    };

    return (
        <div className={`h-screen w-full ${getBackgroundColor()} flex flex-col relative overflow-hidden`}>
            {/* Video containers */}
            {isVideoCall && (
                <>
                    {/* Remote video (full screen) */}
                    <div className="absolute inset-0 bg-gray-900">
                        <video
                            ref={remoteVideoRef}
                            className="w-full h-full object-cover"
                            autoPlay
                            playsInline
                        />
                        {/* Placeholder when no remote video */}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                            <div className="text-center text-white">
                                <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl font-bold">
                                        {contactName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Local video (small window) */}
                    <div className="absolute top-4 right-4 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg z-10">
                        {isVideoEnabled ? (
                            <video
                                ref={localVideoRef}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                playsInline
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                <VideoOff className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Header - Contact info */}
            <div className="relative z-20 pt-12 pb-8 text-center text-white">
                <div className="flex flex-col items-center">
                    {/* Avatar for voice calls */}
                    {!isVideoCall && (
                        <div className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                            <span className="text-5xl font-bold text-white">
                                {contactName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    
                    <h1 className="text-2xl font-semibold mb-1">{contactName}</h1>
                    {contactNumber && (
                        <p className="text-sm text-white text-opacity-80 mb-2">{contactNumber}</p>
                    )}
                    <p className="text-lg text-white text-opacity-90">{getStatusText()}</p>
                </div>
            </div>

            {/* Spacer to push controls to bottom */}
            <div className="flex-1"></div>

            {/* Call controls */}
            <div className="relative z-20 pb-12 px-8">
                <div className="flex justify-center items-center space-x-8">
                    {/* Mute button */}
                    <button
                        onClick={handleToggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isMuted 
                                ? 'bg-red-500 bg-opacity-90' 
                                : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                        }`}
                    >
                        {isMuted ? (
                            <MicOff className="w-6 h-6 text-white" />
                        ) : (
                            <Mic className="w-6 h-6 text-white" />
                        )}
                    </button>

                    {/* End call button */}
                    <button
                        onClick={onEndCall}
                        className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg"
                    >
                        <PhoneOff className="w-8 h-8 text-white" />
                    </button>

                    {/* Video toggle (only for video calls) */}
                    {isVideoCall && (
                        <button
                            onClick={handleToggleVideo}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                                !isVideoEnabled 
                                    ? 'bg-red-500 bg-opacity-90' 
                                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                            }`}
                        >
                            {isVideoEnabled ? (
                                <Video className="w-6 h-6 text-white" />
                            ) : (
                                <VideoOff className="w-6 h-6 text-white" />
                            )}
                        </button>
                    )}

                    {/* Speaker toggle (only for voice calls) */}
                    {!isVideoCall && (
                        <button
                            onClick={handleToggleSpeaker}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                                isSpeakerOn 
                                    ? 'bg-blue-500 bg-opacity-90' 
                                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                            }`}
                        >
                            {isSpeakerOn ? (
                                <Volume2 className="w-6 h-6 text-white" />
                            ) : (
                                <VolumeX className="w-6 h-6 text-white" />
                            )}
                        </button>
                    )}
                </div>

                {/* Additional controls row for video calls */}
                {isVideoCall && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={handleToggleSpeaker}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                                isSpeakerOn 
                                    ? 'bg-blue-500 bg-opacity-90' 
                                    : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                            }`}
                        >
                            {isSpeakerOn ? (
                                <Volume2 className="w-5 h-5 text-white" />
                            ) : (
                                <VolumeX className="w-5 h-5 text-white" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NativeCallScreen;