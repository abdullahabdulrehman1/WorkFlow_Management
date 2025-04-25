import React from 'react';
import { router } from '@inertiajs/react';
import { Switch } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import SaveIndicator from './SaveIndicator';

export default function WorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    const handleClearCanvas = () => {
        onClearCanvas();
        toast.success('Canvas cleared');
    };

    return (
        <div className='flex justify-between items-center mb-4'>
            <div className='flex gap-4 items-center'>
                <button 
                    className='text-red-500 border border-red-300 px-4 py-1 rounded-full text-sm font-medium hover:bg-red-50'
                    onClick={handleClearCanvas}
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