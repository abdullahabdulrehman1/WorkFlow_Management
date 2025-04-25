import { Switch } from '@headlessui/react'
import { router, usePage } from '@inertiajs/react'
import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { toast } from 'react-hot-toast'
import ActionDialog from '../components/actionDialog'
import { WorkflowCanvasWrapper } from '../components/canvas'
import WorkflowLayout from '../components/layout/WorkflowLayout'
import SaveIndicator from '../components/SaveIndicator'

export default function CreateNewWorkflow () {
    const { url } = usePage();
    // Get workflow id from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('id');
    
    const [isDraftOpen, setIsDraftOpen] = useState(false)
    const [workflow, setWorkflow] = useState(null);
    const [isLoading, setIsLoading] = useState(!!workflowId);
    const [error, setError] = useState(null);
    const [justSaved, setJustSaved] = useState(false);
    const canvasRef = useRef(null)
    
    // Reset the save indicator after a delay
    useEffect(() => {
        if (justSaved) {
            const timer = setTimeout(() => {
                setJustSaved(false);
            }, 3000); // Show for 3 seconds
            
            return () => clearTimeout(timer);
        }
    }, [justSaved]);
    
    // Fetch workflow data if editing an existing workflow
    useEffect(() => {
        if (workflowId) {
            fetchWorkflowData();
        }
    }, [workflowId]);
    
    // Fetch workflow and canvas data
    const fetchWorkflowData = async () => {
        setIsLoading(true);
        const loadingToast = toast.loading('Loading workflow data...');
        
        try {
            // Get workflow details
            const workflowResponse = await axios.get(`/api/workflows/${workflowId}`);
            
            // Get canvas data
            const canvasResponse = await axios.get(`/api/workflows/${workflowId}/canvas`);
            
            const workflowData = workflowResponse.data.workflow;
            setWorkflow(workflowData);
            
            // Set status switch based on workflow status
            setIsDraftOpen(workflowData.status === 'published');
            
            // Log the data for debugging
            console.log("Loaded workflow data:", workflowData);
            console.log("Loaded canvas data:", canvasResponse.data);
            
            // Load canvas data into the canvas if available
            if (canvasRef.current && canvasResponse.data) {
                // Use a slightly longer timeout to ensure the canvas is fully mounted
                setTimeout(() => {
                    canvasRef.current.loadCanvas(canvasResponse.data);
                    toast.success('Workflow loaded successfully');
                }, 500);
            }
            
            toast.dismiss(loadingToast);
        } catch (err) {
            console.error('Error fetching workflow data:', err);
            setError('Failed to load workflow. It may have been deleted or you don\'t have permission to view it.');
            
            toast.dismiss(loadingToast);
            toast.error('Failed to load workflow data');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.clearCanvas();
            toast.success('Canvas cleared');
        }
    }
    
    // Save workflow and canvas data
    const handleSave = async () => {
        if (!canvasRef.current) return;
        
        // Show loading toast
        const loadingToast = toast.loading('Saving workflow...');
        
        try {
            let workflowIdToUse = workflowId;
            const canvasData = canvasRef.current.getCanvasData();
            
            // Get trigger ID from the trigger node in the canvas
            const triggerNode = canvasData.nodes.find(node => node.type === 'trigger');
            const triggerId = triggerNode?.data?.trigger_id || 1; // Default to ID 1 if not found
            
            console.log("Canvas data being saved:", canvasData);
            
            // If no workflow ID, create a new workflow first
            if (!workflowId) {
                try {
                    const createResponse = await axios.post('/api/workflows', {
                        name: 'Untitled Workflow', 
                        status: isDraftOpen ? 'published' : 'draft',
                        trigger_id: triggerId
                    });
                    
                    workflowIdToUse = createResponse.data.workflow.id;
                    
                    // Update the URL with the new workflow ID without reloading
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('id', workflowIdToUse);
                    window.history.pushState({}, '', newUrl);
                    
                    // Update local state
                    setWorkflow(createResponse.data.workflow);
                } catch (error) {
                    console.error('Error creating workflow:', error);
                    toast.dismiss(loadingToast);
                    toast.error('Failed to create workflow');
                    return;
                }
            } else {
                // Update existing workflow
                await axios.put(`/api/workflows/${workflowId}`, {
                    name: workflow?.name || 'Untitled Workflow',
                    status: isDraftOpen ? 'published' : 'draft',
                    trigger_id: triggerId
                });
            }
            
            // Now save the canvas data with the workflow ID we have
            if (workflowIdToUse) {
                // Ensure the connections array is included even if empty
                // and all action nodes have action_id set
                const payload = {
                    actions: canvasData.actions || [],
                    connections: canvasData.connections || [],
                    trigger_id: triggerId
                };
                
                if (payload.actions.length === 0) {
                    // Add a default action if no actions exist
                    payload.actions.push({
                        id: 't-1', // Use consistent ID format with prefixed trigger nodes
                        type: 'trigger',
                        action_id: 1, // Required by the backend
                        trigger_id: triggerId,
                        label: 'Default Trigger',
                        configuration_json: {},
                        x: 300,
                        y: 50
                    });
                } else {
                    // Ensure all action nodes have action_id set
                    payload.actions = payload.actions.map(action => ({
                        ...action,
                        action_id: action.action_id || 1 // Default to 1 if not set
                    }));
                }
            
                await axios.post(`/api/workflows/${workflowIdToUse}/canvas`, payload);
                
                toast.dismiss(loadingToast);
                toast.success('Workflow saved successfully');
                setJustSaved(true);
                
                // If this was a new workflow, fetch the full workflow data to update our state
                if (!workflowId && workflowIdToUse) {
                    const workflowResponse = await axios.get(`/api/workflows/${workflowIdToUse}`);
                    setWorkflow(workflowResponse.data.workflow);
                }
            }
        } catch (err) {
            console.error('Error saving workflow:', err);
            toast.dismiss(loadingToast);
            
            // Show more detailed error information
            if (err.response && err.response.data) {
                const errorMessages = err.response.data.errors ? 
                    Object.values(err.response.data.errors).flat().join('\n') : 
                    err.response.data.message || 'Unknown error';
                
                toast.error(`Failed to save workflow: ${errorMessages}`);
            } else {
                toast.error('Failed to save workflow');
            }
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <WorkflowLayout breadcrumbText={workflowId ? `Edit Workflow: ${workflow?.name || ''}` : 'Create New Workflow'}>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <p>Loading workflow data...</p>
                    </div>
                ) : (
                    <>
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
                                    onClick={handleSave}
                                >
                                    Save workflow
                                </button>
                            </div>
                        </div>
                        <div className='flex gap-4 relative'>
                            <div className='flex-1'>
                                <WorkflowCanvasWrapper 
                                    ref={canvasRef} 
                                    workflowId={workflowId}
                                    workflowName={workflow?.name}
                                    triggerName={workflow?.trigger?.name}
                                    triggerID={workflow?.trigger_id}
                                />
                            </div>
                            <div className='absolute top-0 right-0'>
                                <ActionDialog />
                            </div>
                        </div>
                    </>
                )}
            </WorkflowLayout>
        </DndProvider>
    )
}
