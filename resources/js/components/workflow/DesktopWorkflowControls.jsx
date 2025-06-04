import React, { useState, useEffect, useRef } from 'react';
import { Switch } from '@headlessui/react';
import { PhoneCall, Users, Video, X, ChevronDown, Monitor } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import SaveIndicator from '../SaveIndicator';
import { getTestPhoneNumbers, makeCall } from '../../utils/CallService';
import { useWorkflowRealtime } from './useWorkflowRealtime';

function DesktopWorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [isDesktopCallModalOpen, setIsDesktopCallModalOpen] = useState(false);
    const [isDevicesDropdownOpen, setIsDevicesDropdownOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState('');
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [desktopCallType, setDesktopCallType] = useState('voice');
    const testNumbers = getTestPhoneNumbers();
    const dropdownRef = useRef(null);
    
    // Use the custom hook for real-time functionality
    const { 
        connectedDevices, 
        isConnected, 
        connectionId, 
        sendBroadcastMessage,
        startDesktopCall
    } = useWorkflowRealtime(workflow?.id);
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDevicesDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    const handleCallTest = () => {
        setIsCallModalOpen(true);
    };

    const handleDesktopCall = () => {
        setIsDesktopCallModalOpen(true);
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

    const initiateDesktopCall = async () => {
        try {
            const success = await startDesktopCall(desktopCallType);
            if (success) {
                setIsDesktopCallModalOpen(false);
            }
        } catch (error) {
            console.error('Desktop call error:', error);
            toast.error('Desktop call failed: ' + error.message);
        }
    };
    
    const testBroadcast = async () => {
        await sendBroadcastMessage('Test broadcast from this device!');
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
                        {/* Connection status indicator */}
                        <span className={`ml-2 w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                              title={isConnected ? 'Connected to real-time server' : 'Disconnected from real-time server'}>
                        </span>
                    </div>
                )}
            </div>
            <div className='flex gap-2'>
                {/* Connected Devices Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        className='flex items-center gap-1 border border-purple-300 bg-purple-50 text-purple-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-purple-100'
                        onClick={() => setIsDevicesDropdownOpen(!isDevicesDropdownOpen)}
                    >
                        <Users className="w-4 h-4" />
                        <span>Connected ({connectedDevices.length})</span>
                        {isConnected && <span className="w-2 h-2 bg-green-500 rounded-full ml-1"></span>}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isDevicesDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Devices Dropdown */}
                    {isDevicesDropdownOpen && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-80 z-50 max-h-64 overflow-y-auto">
                            <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-sm">Connected Devices</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className="text-xs text-gray-500">
                                            {isConnected ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="py-2">
                                {connectedDevices.length === 0 ? (
                                    <div className="px-4 py-3 text-center text-gray-500 text-sm">
                                        No devices connected
                                    </div>
                                ) : (
                                    connectedDevices.map((device) => (
                                        <div 
                                            key={device.id}
                                            className={`px-4 py-2 hover:bg-gray-50 ${
                                                device.isCurrentDevice ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-sm truncate">
                                                            {device.name}
                                                        </p>
                                                        {device.isCurrentDevice && (
                                                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">
                                                                You
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate">{device.browser}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {device.connectedAt} • {device.id.substring(0, 6)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <div className="px-4 py-2 border-t bg-gray-50 rounded-b-lg">
                                <p className="text-xs text-gray-500 text-center">
                                    Real-time on: {workflow?.name || 'Unknown Workflow'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Calling Button */}
                <div className='relative'>
                    <button 
                        className='flex items-center gap-1 border border-emerald-300 bg-emerald-50 text-emerald-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-emerald-100'
                        onClick={handleDesktopCall}
                    >
                        <Monitor className="w-4 h-4" />
                        <span>Desktop Calling</span>
                    </button>
                    
                    {/* Desktop Call Modal */}
                    {isDesktopCallModalOpen && (
                        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium">Start Desktop Call</h3>
                                <button 
                                    onClick={() => setIsDesktopCallModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    This will send a native call notification to all connected devices in this workflow.
                                </p>
                                
                                <div className="mb-3">
                                    <label className="block text-sm font-medium mb-1">Call Type</label>
                                    <div className="flex gap-2">
                                        <button
                                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1 ${
                                                desktopCallType === 'voice' 
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                                            }`}
                                            onClick={() => setDesktopCallType('voice')}
                                        >
                                            <PhoneCall className="w-4 h-4" />
                                            Voice
                                        </button>
                                        <button
                                            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1 ${
                                                desktopCallType === 'video' 
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                                            }`}
                                            onClick={() => setDesktopCallType('video')}
                                        >
                                            <Video className="w-4 h-4" />
                                            Video
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 mb-3">
                                    Connected devices: {connectedDevices.filter(d => !d.isCurrentDevice).length} (excluding you)
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                    onClick={() => setIsDesktopCallModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex-1 bg-emerald-500 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-1"
                                    onClick={initiateDesktopCall}
                                    disabled={connectedDevices.filter(d => !d.isCurrentDevice).length === 0}
                                >
                                    {desktopCallType === 'video' ? (
                                        <><Video className="w-4 h-4" /> Start Video Call</>
                                    ) : (
                                        <><PhoneCall className="w-4 h-4" /> Start Voice Call</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Regular Call Button */}
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
                
                {/* Test Broadcast Button */}
                <button 
                    className='flex items-center gap-1 border border-green-300 bg-green-50 text-green-600 px-4 py-1 rounded-full text-sm font-medium hover:bg-green-100'
                    onClick={testBroadcast}
                >
                    📢 Test Broadcast
                </button>
                
                {/* Action Buttons */}
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
    );
}

export default DesktopWorkflowControls;