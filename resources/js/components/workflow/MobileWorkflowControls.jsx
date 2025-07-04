import React from 'react';
import { Switch } from '@headlessui/react';
import { PhoneCall } from 'lucide-react';
import { router } from '@inertiajs/react';
import { toast } from 'react-hot-toast';
import { Capacitor } from '@capacitor/core';
import SaveIndicator from '../SaveIndicator';
import { CallPlugin } from '../../utils/iOSSimpleCall';
import { useWorkflowRealtime } from './useWorkflowRealtime';

function MobileWorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    // Initialize real-time connection to listen for incoming DesktopCallEvent (e.g., from 'Call iOS' button on desktop)
    useWorkflowRealtime(workflow?.id);

    const handleCallButtonClick = async () => {
        console.log('📞 Call button clicked - starting enhanced debugging...');
        
        try {
            if (Capacitor.getPlatform() !== 'ios' || !Capacitor.isNativePlatform()) {
                toast.error('This feature works only on iOS device/simulator');
                return;
            }
            
            // Use mock call screen (works in simulator!)
            await CallPlugin.showMockCallScreen();
            toast.success('Mock call screen shown');
            
            // Uncomment this line if you want to test real CallKit on physical device:
            // await CallPlugin.showTestCall();
            
        } catch (err) {
            console.error(err);
            toast.error('Failed to show call screen');
        }
    };

    return (
        <div className='mb-4'>
            {/* Top section with workflow name and save indicator */}
            {workflow && (
                <div className="mb-3 px-3 py-1 bg-blue-100 border border-blue-300 rounded-full flex items-center overflow-hidden">
                    {workflow.trigger && (
                        <span className="ml-1 text-blue-700 flex items-center whitespace-nowrap">
                            {workflow.trigger.name} 
                            <span className="ml-1 text-xs text-blue-600">→</span>
                        </span>
                    )}
                    
                    <div className="flex items-center flex-1 min-w-0 ml-2">
                        <span className="text-blue-700 text-sm font-medium truncate">
                            {workflow.name}
                        </span>
                        <SaveIndicator 
                            justSaved={justSaved} 
                            size="sm" 
                            className="ml-2 flex-shrink-0" 
                        />
                    </div>
                </div>
            )}

            {/* Main buttons section */}
            <div className='flex flex-col gap-3'>
                {/* Action buttons row */}
                <div className='flex justify-between items-center gap-2'>
                    <button 
                        className='text-red-500 border border-red-300 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-50 flex-1'
                        onClick={onClearCanvas}
                    >
                        Cancel
                    </button>
                    
                    <button 
                        className='bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium hover:bg-blue-600 flex-1'
                        onClick={onSave}
                    >
                        Save workflow
                    </button>
                </div>

                {/* Call button - separate row for prominence */}
                <div className='flex justify-center'>
                    <button 
                        onClick={handleCallButtonClick}
                        className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-md transition-colors duration-200'
                        title="Show mock call screen (works in simulator)"
                    >
                        <PhoneCall size={16} />
                        <span className="text-sm font-medium">Call</span>
                    </button>
                </div>
            </div>

            {/* Draft Toggle */}
            <div className='flex justify-between items-center mt-4 p-2 bg-gray-50 rounded-lg'>
                <span className='text-sm text-gray-700'>Draft Mode</span>
                <Switch
                    checked={isDraftOpen}
                    onChange={setIsDraftOpen}
                    className={`${
                        isDraftOpen ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                    <span
                        className={`${
                            isDraftOpen ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                </Switch>
            </div>
        </div>
    );
}

export default MobileWorkflowControls;