import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Switch } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import SaveIndicator from './SaveIndicator';
import useIsMobile from '../hooks/useIsMobile';
import { PhoneCall, Video, X, Save, ArrowLeft } from 'lucide-react';
import { subscribeToPush } from '../components/notifications/PushManager';
import { makeCall, getTestPhoneNumbers } from '../utils/CallService';

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
    const [selectedNumber, setSelectedNumber] = useState('');
    const [isVideoCall, setIsVideoCall] = useState(false);
    const testNumbers = getTestPhoneNumbers();
    
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
    const [isCallBottomSheetOpen, setIsCallBottomSheetOpen] = useState(false);
    const [selectedNumber, setSelectedNumber] = useState('');
    const [isVideoCall, setIsVideoCall] = useState(false);
    const testNumbers = getTestPhoneNumbers();
    
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
                                    ? 'translate-x-5'
                                    : 'translate-x-1'
                            } inline-block h-3 w-3 transform rounded-full bg-white transition`}
                        />
                    </Switch>
                    <span className='text-xs font-medium'>
                        {isDraftOpen ? 'Published' : 'Draft'}
                    </span>
                </div>
                <div className='flex items-center gap-2'>
                    <button 
                        className='flex items-center justify-center gap-1 border border-blue-300 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-medium active:bg-blue-100'
                        onClick={handleCallTest}
                        aria-label="Make Call"
                    >
                        <PhoneCall className="w-3 h-3" />
                        <span className="hidden xs:inline">Call</span>
                    </button>
                    <button 
                        className='flex items-center justify-center gap-1 text-red-500 border border-red-300 px-2.5 py-1 rounded-full text-xs font-medium active:bg-red-100'
                        onClick={onClearCanvas}
                        aria-label="Clear Canvas"
                    >
                        <X className="w-3 h-3" />
                        <span className="hidden xs:inline">Clear</span>
                    </button>
                </div>
            </div>
            
            {/* Bottom section with save and cancel buttons */}
            <div className='flex justify-between gap-2 mt-3'>
                <button 
                    className='flex-1 border border-gray-300 px-2 py-1.5 rounded-full text-xs font-medium active:bg-gray-100 flex items-center justify-center gap-1'
                    onClick={() => router.visit('/workflows')}
                >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Cancel</span>
                </button>
                <button 
                    className='flex-1 bg-yellow-400 text-black px-2 py-1.5 rounded-full text-xs font-semibold shadow active:bg-yellow-500 active:shadow-inner flex items-center justify-center gap-1'
                    onClick={onSave}
                >
                    <Save className="w-3 h-3" />
                    <span>Save</span>
                </button>
            </div>
            
            {/* Mobile Call Bottom Sheet */}
            {isCallBottomSheetOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-25 z-50 flex flex-col justify-end">
                    <div className="bg-white rounded-t-xl p-4 animate-slide-up">
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
                        
                        <h3 className="font-medium text-lg mb-4 text-center">Make a Call</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">Contact</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-3 text-base"
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
                        
                        <div className="flex items-center justify-center mb-5">
                            <input 
                                type="checkbox" 
                                id="mobileVideoCall" 
                                checked={isVideoCall}
                                onChange={() => setIsVideoCall(!isVideoCall)}
                                className="mr-2 h-5 w-5"
                            />
                            <label htmlFor="mobileVideoCall" className="text-base">Video Call</label>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-1">
                            <button
                                className="bg-gray-100 text-gray-800 py-3 rounded-xl text-base font-medium active:bg-gray-200"
                                onClick={() => setIsCallBottomSheetOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={`${isVideoCall ? 'bg-purple-500' : 'bg-green-500'} text-white py-3 rounded-xl text-base font-medium active:opacity-90 flex items-center justify-center gap-2`}
                                onClick={initiateCall}
                            >
                                {isVideoCall ? (
                                    <><Video className="w-5 h-5" /> Video</>
                                ) : (
                                    <><PhoneCall className="w-5 h-5" /> Call</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}