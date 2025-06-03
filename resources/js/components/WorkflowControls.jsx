import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Switch } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import SaveIndicator from './SaveIndicator';
import useIsMobile from '../hooks/useIsMobile';
import { PhoneCall, Video, X, Save, ArrowLeft, Users } from 'lucide-react';
import { subscribeToPush } from '../components/notifications/PushManager';
import { makeCall, getTestPhoneNumbers } from '../utils/CallService';
import Echo from 'laravel-echo';
import axios from 'axios';

export default function WorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    const isMobile = useIsMobile();
    
    // Enhanced save handler that also subscribes to push notifications
    const handleSaveAndSubscribe = async () => {
        // First, save the workflow
        onSave();
        
        // Then try to subscribe to push notifications
        try {
            const result = await subscribeToPush();
            if (result.success) {
                console.log('Successfully subscribed to push notifications');
            } else if (result.reason === 'permission-denied') {
                toast.error('Please enable notifications for workflow alerts');
            }
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
        }
    };
    
    const handleClearCanvas = () => {
        onClearCanvas();
        toast.success('Canvas cleared');
    };

    return isMobile ? (
        <MobileWorkflowControls
            workflow={workflow}
            isDraftOpen={isDraftOpen}
            setIsDraftOpen={setIsDraftOpen}
            justSaved={justSaved}
            onSave={handleSaveAndSubscribe}
            onClearCanvas={handleClearCanvas}
        />
    ) : (
        <DesktopWorkflowControls
            workflow={workflow}
            isDraftOpen={isDraftOpen}
            setIsDraftOpen={setIsDraftOpen}
            justSaved={justSaved}
            onSave={handleSaveAndSubscribe}
            onClearCanvas={handleClearCanvas}
        />
    );
}

// Desktop version of the controls
function DesktopWorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [isDevicesModalOpen, setIsDevicesModalOpen] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState('');
    const [isVideoCall, setIsVideoCall] = useState(false);
    const testNumbers = getTestPhoneNumbers();
    const connectionId = React.useRef(Math.random().toString(36).substring(7));
    
    // Log devices when they change
    useEffect(() => {
        console.log('Connected devices updated:', connectedDevices);
    }, [connectedDevices]);

    // Handle Echo connection and events
    useEffect(() => {
        console.log('Initializing Echo connection...');
        
        // Add current device to the list immediately
        const currentDevice = {
            id: connectionId.current,
            name: `Device connected from ${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown Browser'}`,
            browser: navigator.userAgent,
            isCurrentDevice: true
        };
        
        setConnectedDevices([currentDevice]);
        console.log('Added current device:', currentDevice);
        
        // Subscribe to the public channel
        const echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: window.location.hostname,
            wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
            forceTLS: false,
            enabledTransports: ['ws', 'wss']
        });

        console.log('Subscribing to channel:', `workflow.${workflow.id}`);

        // Use public channel
        const channel = echo.channel(`workflow.${workflow.id}`)
            .listen('WorkflowEvent', (e) => {
                console.log('Received event:', e);
                
                if (e.type === 'connect') {
                    console.log('Processing connect event for device:', e.connectionId);
                    // Only show toast and add device if it's not our own connection
                    if (e.connectionId !== connectionId.current) {
                        toast.success(`New device connected: ${e.message || 'Anonymous Device'}`);
                        setConnectedDevices(prev => {
                            const existingDevice = prev.find(d => d.id === e.connectionId);
                            if (!existingDevice) {
                                const newDevice = { 
                                    id: e.connectionId, 
                                    name: e.message || 'Anonymous Device',
                                    browser: e.browser || navigator.userAgent,
                                    isCurrentDevice: false
                                };
                                console.log('Adding new device:', newDevice);
                                const updated = [...prev, newDevice];
                                console.log('Updated devices list:', updated);
                                return updated;
                            }
                            return prev;
                        });
                    }
                } else if (e.type === 'disconnect') {
                    console.log('Processing disconnect event for device:', e.connectionId);
                    // Only show toast and remove device if it's not our own disconnection
                    if (e.connectionId !== connectionId.current) {
                        toast.error(`Device disconnected: ${e.message || 'Anonymous Device'}`);
                        setConnectedDevices(prev => {
                            const updatedDevices = prev.filter(d => d.id !== e.connectionId);
                            console.log('Devices after disconnect:', updatedDevices);
                            return updatedDevices;
                        });
                    }
                } else if (e.type === 'message') {
                    // Show broadcast messages
                    toast(e.message, {
                        icon: '📢',
                        duration: 4000,
                    });
                }
            });

        // Send connect event with a delay to ensure connection is established
        const timeoutId = setTimeout(() => {
            console.log('Sending initial connect event...');
            axios.post(`/api/workflow/${workflow.id}/broadcast`, {
                message: `Device connected from ${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown Browser'}`,
                type: 'connect',
                connectionId: connectionId.current,
                browser: navigator.userAgent
            }).then(() => {
                console.log('Connect event sent successfully');
            }).catch(error => {
                console.error('Error sending connect event:', error);
            });
        }, 1000);

        // Log connection status
        echo.connector.pusher.connection.bind('connected', () => {
            console.log('Connected to Reverb server');
            console.log('Current connection ID:', connectionId.current);
            toast.success('Connected to real-time server');
        });

        echo.connector.pusher.connection.bind('error', (error) => {
            console.error('Connection error:', error);
            toast.error('Connection error: ' + error.message);
        });

        return () => {
            clearTimeout(timeoutId);
            
            // Send disconnect event
            console.log('Sending disconnect event...');
            axios.post(`/api/workflow/${workflow.id}/broadcast`, {
                message: `Device disconnected from ${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown Browser'}`,
                type: 'disconnect',
                connectionId: connectionId.current
            }).then(() => {
                console.log('Disconnect event sent successfully');
            }).catch(error => {
                console.error('Error sending disconnect event:', error);
            });
            console.log('Cleaning up Echo connection...');
            channel.unsubscribe();
        };
    }, [workflow.id]);
    
    const handleCallTest = () => {
        setIsCallModalOpen(true);
    };
    
    const initiateCall = async () => {
        const number = selectedNumber || testNumbers[0].number;
        try {
            toast.promise(
                makeCall(number, isVideoCall),
                {
                    loading: 'Initiating call...',
                    success: 'Call initiated successfully',
                    error: (err) => `Call failed: ${err.message || 'Unknown error'}`
                }
            );
            setIsCallModalOpen(false);
        } catch (error) {
            console.error('Call error:', error);
            toast.error('Call failed: ' + error.message);
        }
    };
    
    const testBroadcast = async () => {
        try {
            await axios.post(`/api/workflow/${workflow.id}/broadcast`, {
                message: `Test broadcast from ${navigator.userAgent.split('(')[1]?.split(')')[0] || 'Unknown Browser'}`,
                type: 'message',
                connectionId: connectionId.current
            });
            toast.success('Broadcast sent!');
        } catch (error) {
            console.error('Broadcast error:', error);
            toast.error('Failed to broadcast');
        }
    };
    
    return (
        <div className='flex justify-between items-center mb-4'>
            <div className='flex gap-4 items-center'>
                <button 
                    className='text-red-500 border border-red-300 px-4 py-1 rounded-full text-sm font-medium hover:bg-red-50'
                    onClick={onClearCanvas}
                >
                    Clear canvas
                </button>
                <Switch
                    checked={isDraftOpen}
                    onChange={setIsDraftOpen}
                    className={`${
                        isDraftOpen ? 'bg-blue-500' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full`}
                >
                    <span
                        className={`${
                            isDraftOpen
                                ? 'translate-x-6'
                                : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                </Switch>
                <span className='text-sm font-medium'>
                    {isDraftOpen ? 'Published' : 'Draft'}
                </span>
                
                {workflow && (
                    <div className="ml-4 px-4 py-1 bg-blue-100 border border-blue-300 rounded-full flex items-center">
                        <span className="font-medium">{workflow.name}</span>
                        {workflow.trigger && (
                            <span className="ml-2 text-blue-700 flex items-center">
                                | <span className="mx-1">{workflow.trigger.name}</span>
                                <SaveIndicator saved={justSaved} />
                            </span>
                        )}
                    </div>
                )}
            </div>
            <div className='flex gap-2'>
                <button 
                    className='flex items-center gap-1 border border-purple-300 bg-purple-50 text-purple-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-purple-100'
                    onClick={() => setIsDevicesModalOpen(true)}
                >
                    <Users className="w-4 h-4" />
                    <span>Connected ({connectedDevices.length})</span>
                </button>
                <div className='relative'>
                    <button 
                        className='flex items-center gap-1 border border-blue-300 bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-100'
                        onClick={handleCallTest}
                    >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call</span>
                    </button>
                    
                    {/* Call Modal */}
                    {isCallModalOpen && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium">Make a Call</h3>
                                <button 
                                    onClick={() => setIsCallModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Select Number</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                                    value={selectedNumber}
                                    onChange={(e) => setSelectedNumber(e.target.value)}
                                >
                                    {testNumbers.map((item, index) => (
                                        <option key={index} value={item.number}>
                                            {item.name}: {item.number}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex items-center mb-4">
                                <input 
                                    type="checkbox" 
                                    id="videoCall" 
                                    checked={isVideoCall}
                                    onChange={() => setIsVideoCall(!isVideoCall)}
                                    className="mr-2"
                                />
                                <label htmlFor="videoCall" className="text-sm">Video Call</label>
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                    onClick={() => setIsCallModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 bg-green-500 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1"
                                    onClick={initiateCall}
                                >
                                    {isVideoCall ? (
                                        <><Video className="w-4 h-4" /> Video Call</>
                                    ) : (
                                        <><PhoneCall className="w-4 h-4" /> Voice Call</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    className='flex items-center gap-1 border border-green-300 bg-green-50 text-green-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-green-100'
                    onClick={testBroadcast}
                >
                    Test Broadcast
                </button>
                
                <button 
                    className='border px-4 py-1 rounded-full text-sm font-medium'
                    onClick={() => router.visit('/workflows')}
                >
                    Cancel
                </button>
                <button 
                    className='bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold shadow'
                    onClick={onSave}
                >
                    Save workflow
                </button>
            </div>

            {/* Connected Devices Modal */}
            {isDevicesModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-lg">Connected Devices</h3>
                            <button 
                                onClick={() => setIsDevicesModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-2">
                            {connectedDevices.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No devices connected</p>
                            ) : (
                                connectedDevices.map((device) => (
                                    <div 
                                        key={device.id}
                                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <div className="flex-1">
                                            <p className="font-medium">{device.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{device.browser}</p>
                                            <p className="text-xs text-gray-400">ID: {device.id}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mobile version of the controls
function MobileWorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    const [isCallBottomSheetOpen, setIsCallBottomSheetOpen] = useState(false);
    const [isDevicesBottomSheetOpen, setIsDevicesBottomSheetOpen] = useState(false);
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [selectedNumber, setSelectedNumber] = useState('');
    const [isVideoCall, setIsVideoCall] = useState(false);
    const testNumbers = getTestPhoneNumbers();
    
    useEffect(() => {
        // Subscribe to the public channel
        const echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: window.location.hostname,
            wsPort: 8080,
            forceTLS: false,
            enabledTransports: ['ws'],
            disableStats: true,
            cluster: 'mt1',
            encrypted: false
        });

        // Use public channel instead of presence channel
        const channel = echo.channel(`workflow.${workflow.id}`)
            .listen('WorkflowEvent', (e) => {
                console.log('Received event:', e);
                // Handle the event here
            });

        return () => {
            channel.unsubscribe();
        };
    }, [workflow.id]);
    
    const handleCallTest = () => {
        setIsCallBottomSheetOpen(true);
    };
    
    const initiateCall = async () => {
        const number = selectedNumber || testNumbers[0].number;
        try {
            toast.promise(
                makeCall(number, isVideoCall),
                {
                    loading: 'Initiating call...',
                    success: 'Call initiated successfully',
                    error: (err) => `Call failed: ${err.message || 'Unknown error'}`
                }
            );
            setIsCallBottomSheetOpen(false);
        } catch (error) {
            console.error('Call error:', error);
            toast.error('Call failed: ' + error.message);
        }
    };
    
    return (
        <div className='mb-4'>
            {/* Top section with workflow name and save indicator */}
            {workflow && (
                <div className="mb-3 px-3 py-1 bg-blue-100 border border-blue-300 rounded-full flex items-center overflow-hidden">
                    {workflow.trigger && (
                        <span className="ml-1 text-blue-700 flex items-center whitespace-nowrap">
                             <span className="mx-1 truncate">{workflow.trigger.name}</span>
                            <SaveIndicator saved={justSaved} />
                        </span>
                    )}
                </div>
            )}
            
            {/* Middle section with draft switch and action buttons */}
            <div className='flex items-center justify-between mb-2'>
                <div className='flex items-center gap-2'>
                    <Switch
                        checked={isDraftOpen}
                        onChange={setIsDraftOpen}
                        className={`${
                            isDraftOpen ? 'bg-blue-500' : 'bg-gray-200'
                        } relative inline-flex h-5 w-10 items-center rounded-full`}
                    >
                        <span
                            className={`${
                                isDraftOpen
                                    ? 'translate-x-6'
                                    : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                    </Switch>
                    <span className='text-sm font-medium'>
                        {isDraftOpen ? 'Published' : 'Draft'}
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    <button 
                        className='text-red-500 border border-red-300 px-4 py-1 rounded-full text-sm font-medium hover:bg-red-50'
                        onClick={onClearCanvas}
                    >
                        Clear canvas
                    </button>
                    <button 
                        className='border px-4 py-1 rounded-full text-sm font-medium'
                        onClick={() => router.visit('/workflows')}
                    >
                        Cancel
                    </button>
                    <button 
                        className='bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold shadow'
                        onClick={onSave}
                    >
                        Save workflow
                    </button>
                </div>
            </div>
            
            {/* Bottom section with call and test broadcast buttons */}
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <button 
                        className='flex items-center gap-1 border border-blue-300 bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-100'
                        onClick={handleCallTest}
                    >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call</span>
                    </button>
                    
                    <button 
                        className='flex items-center gap-1 border border-green-300 bg-green-50 text-green-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-green-100'
                        onClick={() => {
                            // Implement test broadcast functionality
                        }}
                    >
                        Test Broadcast
                    </button>
                </div>
            </div>
        </div>
    );
}