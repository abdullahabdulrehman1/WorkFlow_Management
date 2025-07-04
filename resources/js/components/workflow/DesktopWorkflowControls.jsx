import React, { useState, useEffect, useRef } from 'react';
import { Switch } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { PhoneCall, Monitor, Smartphone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import SaveIndicator from '../SaveIndicator';
import { useWorkflowRealtime } from './useWorkflowRealtime';

function DesktopWorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    const [isCallingDesktop, setIsCallingDesktop] = useState(false);
    const [isCallingIOS, setIsCallingIOS] = useState(false);
    
    // Use the existing real-time hook for desktop & iOS call functionality
    const { startDesktopCall, startIOSCall, isConnected } = useWorkflowRealtime(workflow?.id);

    const handleDesktopCall = async () => {
        if (!workflow?.id) {
            toast.error('No workflow selected for desktop call');
            return;
        }

        if (!isConnected) {
            toast.error('Not connected to real-time server. Please refresh and try again.');
            return;
        }

        setIsCallingDesktop(true);

        try {
            // Get device/user info for caller name
            const callerName = workflow?.name ? `${workflow.name} Workflow` : 'Desktop Call';
            
            // Start the desktop call using existing service
            const success = await startDesktopCall('voice'); // Default to voice call
            
            if (success) {
                toast.success('📞 Desktop call initiated! Check connected Electron apps.', {
                    duration: 5000,
                    position: 'top-center',
                    style: {
                        background: '#10b981',
                        color: 'white',
                    },
                });
            }
        } catch (error) {
            console.error('❌ Error starting desktop call:', error);
            toast.error('Failed to initiate desktop call: ' + error.message);
        } finally {
            setIsCallingDesktop(false);
        }
    };

    const handleIOSCall = async () => {
        if (!workflow?.id) {
            toast.error('No workflow selected for iOS call');
            return;
        }

        if (!isConnected) {
            toast.error('Not connected to real-time server. Please refresh and try again.');
            return;
        }

        setIsCallingIOS(true);

        try {
            const success = await startIOSCall();
            if (success) {
                toast.success('📱 iOS call initiated! Check connected iOS devices.', {
                    duration: 5000,
                    position: 'top-center',
                    style: {
                        background: '#2dd4bf',
                        color: 'white',
                    },
                });
            }
        } catch (error) {
            console.error('❌ Error starting iOS call:', error);
            toast.error('Failed to initiate iOS call: ' + error.message);
        } finally {
            setIsCallingIOS(false);
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
                {/* Desktop Call Button */}
                <button 
                    onClick={handleDesktopCall}
                    disabled={isCallingDesktop || !isConnected}
                    className={`
                        flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium transition-all duration-200
                        ${isCallingDesktop 
                            ? 'bg-green-400 text-white cursor-not-allowed' 
                            : !isConnected
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg'
                        }
                    `}
                    title={
                        !isConnected 
                            ? 'Not connected to real-time server' 
                            : 'Call Desktop - Broadcast call to Electron apps via Laravel Reverb'
                    }
                >
                    {isCallingDesktop ? (
                        <>
                            <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                            Calling...
                        </>
                    ) : (
                        <>
                            <Monitor size={14} />
                            Call Desktop
                        </>
                    )}
                </button>

                {/* Call iOS Button */}
                <button 
                    onClick={handleIOSCall}
                    disabled={isCallingIOS || !isConnected}
                    className={`
                        flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium transition-all duration-200
                        ${isCallingIOS 
                            ? 'bg-teal-400 text-white cursor-not-allowed' 
                            : !isConnected
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-teal-500 hover:bg-teal-600 text-white shadow-md hover:shadow-lg'
                        }
                    `}
                    title={
                        !isConnected 
                            ? 'Not connected to real-time server' 
                            : 'Call iOS - Trigger mock call screen on iOS devices via Laravel Reverb'
                    }
                >
                    {isCallingIOS ? (
                        <>
                            <div className="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"></div>
                            Calling...
                        </>
                    ) : (
                        <>
                            <PhoneCall size={14} />
                            Call iOS
                        </>
                    )}
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