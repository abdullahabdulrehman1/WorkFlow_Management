import React, { useState, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import { PhoneCall } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import Echo from 'laravel-echo';
import SaveIndicator from '../SaveIndicator';
import { getTestPhoneNumbers, makeCall } from '../../utils/CallService';

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
export default MobileWorkflowControls;