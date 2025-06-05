import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import Echo from 'laravel-echo';
import axios from 'axios';
import desktopCallService from '../../services/DesktopCallService';
import { WindowsNotificationUtil } from '../../utils/WindowsNotification';

// Custom hook for managing Reverb real-time connections
export const useWorkflowRealtime = (workflowId) => {
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const connectionId = useRef(Math.random().toString(36).substring(7));
    const echoInstance = useRef(null);
    const channelRef = useRef(null);
    const isInitialized = useRef(false);
    
    // Helper function to get device info
    const getDeviceInfo = () => {
        const userAgent = navigator.userAgent;
        let deviceName = 'Unknown Device';
        let browser = 'Unknown Browser';
        
        // Extract browser info
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        
        // Extract OS info
        if (userAgent.includes('Windows')) deviceName = `Windows Device (${browser})`;
        else if (userAgent.includes('Mac')) deviceName = `Mac Device (${browser})`;
        else if (userAgent.includes('Linux')) deviceName = `Linux Device (${browser})`;
        else if (userAgent.includes('Android')) deviceName = `Android Device (${browser})`;
        else if (userAgent.includes('iPhone')) deviceName = `iPhone (${browser})`;
        else deviceName = `${browser} Browser`;
        
        return { deviceName, browser: userAgent };
    };

    // Initialize connection when workflow ID changes
    useEffect(() => {
        if (!workflowId || isInitialized.current) {
            return;
        }

        console.log('🔗 [' + connectionId.current + '] Initializing Echo connection for workflow:', workflowId);
        isInitialized.current = true;
        
        const { deviceName, browser } = getDeviceInfo();
        
        // Clean up any existing connection
        if (echoInstance.current) {
            console.log('🧹 Cleaning up existing connection...');
            echoInstance.current.disconnect();
        }
        
        // Initialize Echo instance
        try {
            echoInstance.current = new Echo({
                broadcaster: 'reverb',
                key: import.meta.env.VITE_REVERB_APP_KEY,
                wsHost: window.location.hostname,
                wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
                forceTLS: false,
                enabledTransports: ['ws', 'wss'],
                disableStats: true,
                cluster: 'mt1'
            });

            console.log('📡 [' + connectionId.current + '] Subscribing to channel:', `workflow.${workflowId}`);

            // Subscribe to the workflow channel and store reference
            channelRef.current = echoInstance.current.channel(`workflow.${workflowId}`)
                .listen('.WorkflowEvent', (e) => {
                    console.log('📨 [' + connectionId.current + '] Received WorkflowEvent:', e);
                    
                    if (e.type === 'connect') {
                        console.log('🔌 [' + connectionId.current + '] Device connected event - ID:', e.connectionId, '| My ID:', connectionId.current);
                        
                        setConnectedDevices(prev => {
                            // Check if device already exists
                            const existingDevice = prev.find(d => d.id === e.connectionId);
                            if (!existingDevice) {
                                const newDevice = { 
                                    id: e.connectionId, 
                                    name: e.message.replace('New device connected: ', ''),
                                    browser: e.browser || 'Unknown Browser',
                                    isCurrentDevice: e.connectionId === connectionId.current,
                                    connectedAt: new Date().toLocaleTimeString()
                                };
                                console.log('➕ [' + connectionId.current + '] Adding device to list:', newDevice);
                                
                                // Show toast only for other devices
                                if (e.connectionId !== connectionId.current) {
                                    toast.success(`🔗 ${e.message}`, {
                                        duration: 4000,
                                        position: 'top-right',
                                        icon: '🔗',
                                    });
                                }
                                
                                return [...prev, newDevice];
                            }
                            return prev;
                        });
                        
                    } else if (e.type === 'disconnect') {
                        console.log('🔌 [' + connectionId.current + '] Device disconnected event - ID:', e.connectionId);
                        
                        setConnectedDevices(prev => {
                            const updatedDevices = prev.filter(d => d.id !== e.connectionId);
                            console.log('➖ [' + connectionId.current + '] Devices after disconnect:', updatedDevices.length);
                            
                            // Show toast only for other devices
                            if (e.connectionId !== connectionId.current) {
                                toast(`🔌 ${e.message}`, {
                                    duration: 4000,
                                    position: 'top-right',
                                    icon: '⚠️',
                                    style: {
                                        background: '#fef3c7',
                                        border: '1px solid #f59e0b',
                                        color: '#92400e',
                                    },
                                });
                            }
                            
                            return updatedDevices;
                        });
                        
                    } else if (e.type === 'message') {
                        console.log('📢 [' + connectionId.current + '] Broadcast message received:', e.message);
                        console.log('📢 [' + connectionId.current + '] Message details:', e);
                        
                        // Show broadcast messages to all devices
                        toast(e.message, {
                            icon: '📢',
                            duration: 5000,
                            position: 'top-right',
                            style: {
                                background: '#e0f2fe',
                                border: '1px solid #0284c7',
                                color: '#0c4a6e',
                            },
                        });
                    } else {
                        console.log('❓ [' + connectionId.current + '] Unknown event type:', e.type, e);
                    }
                })
                .listen('.DesktopCallEvent', (e) => {
                    console.log('📞 [' + connectionId.current + '] Received DesktopCallEvent:', e);
                    
                    // Handle incoming desktop call
                    if (e.type === 'desktop_call') {
                        console.log('📞 Incoming desktop call from:', e.callerName);
                        
                        // Don't show call window to the caller themselves
                        if (e.callerId !== connectionId.current) {
                            handleIncomingDesktopCall(e);
                        }
                    }
                })
                .subscribed(() => {
                    console.log('✅ [' + connectionId.current + '] Successfully subscribed to channel workflow.' + workflowId);
                    setIsConnected(true);
                })
                .error((error) => {
                    console.error('❌ [' + connectionId.current + '] Channel subscription error:', error);
                    setIsConnected(false);
                });

            // Also listen to the underlying Pusher events to debug
            if (channelRef.current && channelRef.current.pusherChannel) {
                channelRef.current.pusherChannel.bind_global((eventName, data) => {
                    console.log('🌐 [' + connectionId.current + '] Pusher global event - Name:', eventName, 'Data:', data);
                });
            }

            // Handle connection events directly on Echo connector
            echoInstance.current.connector.pusher.connection.bind('connected', () => {
                console.log('✅ [' + connectionId.current + '] WebSocket connected to Reverb server');
                setIsConnected(true);
                
                toast.success('Connected to real-time server', {
                    icon: '🌐',
                    duration: 2000,
                });
                
                // Add current device to the list immediately
                const currentDevice = {
                    id: connectionId.current,
                    name: `${deviceName} (You)`,
                    browser: browser,
                    isCurrentDevice: true,
                    connectedAt: new Date().toLocaleTimeString()
                };
                
                setConnectedDevices([currentDevice]);
                console.log('➕ [' + connectionId.current + '] Added current device to list');
                
                // Announce this device to others
                setTimeout(async () => {
                    try {
                        console.log('📤 [' + connectionId.current + '] Announcing device connection...');
                        const response = await axios.post(`/api/workflow/${workflowId}/device/connect`, {
                            deviceName: deviceName,
                            browser: browser,
                            connectionId: connectionId.current
                        });
                        console.log('✅ [' + connectionId.current + '] Device announced successfully:', response.data);
                    } catch (error) {
                        console.error('❌ [' + connectionId.current + '] Error announcing device:', error);
                    }
                }, 1500);
            });

            echoInstance.current.connector.pusher.connection.bind('error', (error) => {
                console.error('❌ [' + connectionId.current + '] WebSocket connection error:', error);
                setIsConnected(false);
                toast.error('Connection error: ' + (error.message || 'Unknown error'), {
                    icon: '❌',
                    duration: 5000,
                });
            });

            echoInstance.current.connector.pusher.connection.bind('disconnected', () => {
                console.log('📡 [' + connectionId.current + '] WebSocket disconnected from Reverb server');
                setIsConnected(false);
            });

        } catch (error) {
            console.error('❌ [' + connectionId.current + '] Failed to initialize Echo:', error);
            toast.error('Failed to connect to real-time server');
            isInitialized.current = false;
        }

        // Cleanup function
        return () => {
            console.log('🧹 [' + connectionId.current + '] Cleaning up connection for workflow:', workflowId);
            
            // Send disconnect event before cleanup
            if (isConnected) {
                const { deviceName, browser } = getDeviceInfo();
                axios.post(`/api/workflow/${workflowId}/device/disconnect`, {
                    deviceName: deviceName,
                    browser: browser,
                    connectionId: connectionId.current
                }).catch(error => {
                    console.error('❌ [' + connectionId.current + '] Error sending disconnect event:', error);
                });
            }
            
            // Clean up channel subscription
            if (channelRef.current) {
                try {
                    channelRef.current.unsubscribe();
                } catch (error) {
                    console.error('❌ [' + connectionId.current + '] Error unsubscribing from channel:', error);
                }
                channelRef.current = null;
            }
            
            // Clean up Echo connection
            if (echoInstance.current) {
                try {
                    echoInstance.current.disconnect();
                } catch (error) {
                    console.error('❌ [' + connectionId.current + '] Error disconnecting Echo:', error);
                }
                echoInstance.current = null;
            }
            
            isInitialized.current = false;
            setIsConnected(false);
            setConnectedDevices([]);
        };
    }, [workflowId]);

    // Handle incoming desktop call
    const handleIncomingDesktopCall = async (callEvent) => {
        console.log('📞 Handling incoming desktop call:', callEvent);

        // In Electron, use the main process notification to play ringtone
        if (typeof window !== 'undefined' && window.electron && window.electron.notifications && window.electron.notifications.showCallNotification) {
            await window.electron.notifications.showCallNotification({
                callId: callEvent.callData?.callId || Date.now().toString(),
                contactName: callEvent.callerName,
                isVideoCall: callEvent.callType === 'video'
            });
        } else {
            // Fallback to toast if not in Electron
            toast.success(`📞 Incoming desktop call from ${callEvent.callerName}`, {
                duration: 10000,
                position: 'top-center',
                style: {
                    background: '#10b981',
                    color: 'white',
                    fontSize: '16px',
                },
            });
        }

        // Open native call window if in Electron
        if (desktopCallService.isElectronApp()) {
            try {
                await desktopCallService.openCallWindow({
                    contactName: callEvent.callerName,
                    contactNumber: callEvent.callerId || '',
                    isVideoCall: callEvent.callData?.callType === 'video',
                    callStatus: 'ringing',
                    callId: callEvent.callData?.callId,
                    workflowId: callEvent.callData?.workflowId
                });
            } catch (error) {
                console.error('❌ Error opening call window:', error);
            }
        }
    };

    // Function to send broadcast message
    const sendBroadcastMessage = async (message, type = 'info') => {
        if (!workflowId) {
            toast.error('No workflow selected');
            return false;
        }

        if (!isConnected) {
            toast.error('Not connected to real-time server');
            return false;
        }

        try {
            const { deviceName } = getDeviceInfo();
            console.log('📤 [' + connectionId.current + '] Sending broadcast message:', message);
            
            const response = await axios.post(`/api/workflow/${workflowId}/device/message`, {
                message: message,
                deviceName: deviceName,
                connectionId: connectionId.current,
                type: type
            });
            
            console.log('✅ [' + connectionId.current + '] Broadcast API response:', response.data);
            
            toast.success('Broadcast sent successfully!', {
                icon: '📢',
                duration: 2000,
            });
            
            return true;
        } catch (error) {
            console.error('❌ [' + connectionId.current + '] Broadcast error:', error);
            toast.error('Failed to send broadcast: ' + (error.response?.data?.message || error.message));
            return false;
        }
    };

    // Function to start desktop call
    const startDesktopCall = async (callType = 'voice') => {
        if (!workflowId) {
            toast.error('No workflow selected');
            return false;
        }

        if (!isConnected) {
            toast.error('Not connected to real-time server');
            return false;
        }

        const { deviceName } = getDeviceInfo();
        
        try {
            return await desktopCallService.startDesktopCall(
                workflowId,
                'all',
                deviceName,
                callType
            );
        } catch (error) {
            console.error('❌ Error starting desktop call:', error);
            return false;
        }
    };

    return {
        connectedDevices,
        isConnected,
        connectionId: connectionId.current,
        sendBroadcastMessage,
        startDesktopCall
    };
};