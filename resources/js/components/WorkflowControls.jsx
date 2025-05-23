import React from 'react';
import { router } from '@inertiajs/react';
import { Switch } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import SaveIndicator from './SaveIndicator';
import useIsMobile from '../hooks/useIsMobile';
// Import axios for making HTTP requests
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
    
    const handleClearCanvas = () => {
        onClearCanvas();
        toast.success('Canvas cleared');
    };
    
    const handleSave = async () => {
        // Call the original save function
        await onSave();
        
        // Attempt to send a push notification after saving via Node.js microservice directly
        if (workflow) {
            try {
                // Call the Node.js web push service directly - specifying withCredentials: false to fix CORS issues
                const response = await axios.get('https://fcm.googleapis.com/fcm/send/foyWvpmFQYo:APA91bFSonqRqF2Nqb2JKNLBaBIy', {
                    params: {
                        title: 'Workflow Saved!',
                        body: `Your workflow "${workflow.name}" has been saved.`,
                        url: `/workflows/${workflow.id}`
                    },
                    withCredentials: false // Do not send cookies or auth headers
                });
                
                console.log('Push notification sent via Node.js microservice:', response.data);
            } catch (error) {
                console.error('Failed to send push notification:', error);
                // Continue normally - push notification is optional
            }
        }
    };

    return isMobile ? (
        <MobileWorkflowControls
            workflow={workflow}
            isDraftOpen={isDraftOpen}
            setIsDraftOpen={setIsDraftOpen}
            justSaved={justSaved}
            onSave={handleSave}
            onClearCanvas={handleClearCanvas}
        />
    ) : (
        <DesktopWorkflowControls
            workflow={workflow}
            isDraftOpen={isDraftOpen}
            setIsDraftOpen={setIsDraftOpen}
            justSaved={justSaved}
            onSave={handleSave}
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

// Mobile version of the controls
function MobileWorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    return (
        <div className='mb-4'>
            {/* Top section with workflow name and save indicator */}
            {workflow && (
                <div className="mb-3 px-3 py-1 bg-blue-100 border border-blue-300 rounded-full flex items-center overflow-hidden">
                    <span className="font-medium truncate">{workflow.name}</span>
                    {workflow.trigger && (
                        <span className="ml-1 text-blue-700 flex items-center whitespace-nowrap">
                            | <span className="mx-1 truncate">{workflow.trigger.name}</span>
                            <SaveIndicator saved={justSaved} />
                        </span>
                    )}
                </div>
            )}
            
            {/* Middle section with draft switch */}
            <div className='flex items-center justify-between mb-4'>
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
                                    ? 'translate-x-5'
                                    : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition`}
                        />
                    </Switch>
                    <span className='text-xs font-medium'>
                        {isDraftOpen ? 'Published' : 'Draft'}
                    </span>
                </div>
                <button 
                    className='text-red-500 border border-red-300 px-2 py-1 rounded-full text-xs font-medium hover:bg-red-50 active:bg-red-100'
                    onClick={onClearCanvas}
                >
                    Clear
                </button>
            </div>
            
            {/* Bottom section with save and cancel buttons */}
            <div className='flex justify-between gap-2 mt-3'>
                <button 
                    className='flex-1 border border-gray-300 px-2 py-1.5 rounded-full text-xs font-medium active:bg-gray-100'
                    onClick={() => router.visit('/workflows')}
                >
                    Cancel
                </button>
                <button 
                    className='flex-1 bg-yellow-400 text-black px-2 py-1.5 rounded-full text-xs font-semibold shadow active:bg-yellow-500 active:shadow-inner'
                    onClick={onSave}
                >
                    Save workflow
                </button>
            </div>
        </div>
    );
}