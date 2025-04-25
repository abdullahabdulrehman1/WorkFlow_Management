import axios from 'axios';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function useWorkflow(workflowId) {
    const [workflow, setWorkflow] = useState(null);
    const [isLoading, setIsLoading] = useState(!!workflowId);
    const [error, setError] = useState(null);
    const [isDraftOpen, setIsDraftOpen] = useState(false);
    const [justSaved, setJustSaved] = useState(false);

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
            
            const workflowData = workflowResponse.data.workflow;
            setWorkflow(workflowData);
            
            // Set status switch based on workflow status
            setIsDraftOpen(workflowData.status === 'published');
            
            toast.dismiss(loadingToast);
            return workflowResponse.data;
        } catch (err) {
            console.error('Error fetching workflow data:', err);
            setError('Failed to load workflow. It may have been deleted or you don\'t have permission to view it.');
            
            toast.dismiss(loadingToast);
            toast.error('Failed to load workflow data');
        } finally {
            setIsLoading(false);
        }
    };

    // Save workflow with updated details
    const saveWorkflow = async (canvasData, canvasRef) => {
        const loadingToast = toast.loading('Saving workflow...');
        
        try {
            let workflowIdToUse = workflowId;
            
            // Get trigger ID from the trigger node in the canvas
            const triggerNode = canvasData.nodes?.find(node => node.type === 'trigger');
            const triggerId = triggerNode?.data?.trigger_id || 1; // Default to ID 1 if not found
            
            // If no workflow ID, create a new workflow first
            if (!workflowId) {
                const createResponse = await axios.post('/api/workflows', {
                    name: 'Untitled Workflow', 
                    status: isDraftOpen ? 'published' : 'draft',
                    trigger_id: triggerId
                });
                
                workflowIdToUse = createResponse.data.workflow.id;
                setWorkflow(createResponse.data.workflow);
                
                // Return the new ID for URL updating
                return { success: true, workflowId: workflowIdToUse };
            } else {
                // Update existing workflow
                await axios.put(`/api/workflows/${workflowId}`, {
                    name: workflow?.name || 'Untitled Workflow',
                    status: isDraftOpen ? 'published' : 'draft',
                    trigger_id: triggerId
                });
                
                return { success: true, workflowId };
            }
        } catch (err) {
            console.error('Error saving workflow:', err);
            
            if (err.response && err.response.data) {
                const errorMessages = err.response.data.errors ? 
                    Object.values(err.response.data.errors).flat().join('\n') : 
                    err.response.data.message || 'Unknown error';
                
                toast.error(`Failed to save workflow: ${errorMessages}`);
            } else {
                toast.error('Failed to save workflow');
            }
            
            return { success: false };
        } finally {
            toast.dismiss(loadingToast);
        }
    };

    // Save canvas data for a workflow
    const saveCanvas = async (workflowId, canvasData) => {
        try {
            // Get trigger ID from the trigger node in the canvas
            const triggerNode = canvasData.nodes?.find(node => node.type === 'trigger');
            const triggerId = triggerNode?.data?.trigger_id || 1;

            // Prepare payload for saving canvas data
            const payload = {
                actions: canvasData.actions || [],
                connections: canvasData.connections || [],
                trigger_id: triggerId
            };
            
            // Add default action if needed and ensure all actions have action_id
            if (payload.actions.length === 0) {
                payload.actions.push({
                    id: 't-1',
                    type: 'trigger',
                    action_id: 1,
                    trigger_id: triggerId,
                    label: 'Default Trigger',
                    configuration_json: {},
                    x: 300,
                    y: 50
                });
            } else {
                payload.actions = payload.actions.map(action => ({
                    ...action,
                    action_id: action.action_id || 1
                }));
            }
        
            await axios.post(`/api/workflows/${workflowId}/canvas`, payload);
            setJustSaved(true);
            toast.success('Workflow saved successfully');
            
            return true;
        } catch (err) {
            console.error('Error saving canvas:', err);
            return false;
        }
    };

    return {
        workflow,
        isLoading,
        error,
        isDraftOpen,
        setIsDraftOpen,
        justSaved,
        fetchWorkflowData,
        saveWorkflow,
        saveCanvas
    };
}