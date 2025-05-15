import { usePage } from '@inertiajs/react'
import { useEffect, useRef } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { toast } from 'react-hot-toast'
import ActionDialog from '../components/actionDialog'
import { WorkflowCanvasWrapper } from '../components/canvas'
import WorkflowLayout from '../components/layout/WorkflowLayout'
import WorkflowControls from '../components/WorkflowControls'
import useWorkflow from '../hooks/useWorkflow'
import useWorkflowCanvas from '../hooks/useWorkflowCanvas'
import axios from 'axios'

export default function CreateNewWorkflow() {
    // Get csrf token from Inertia
    const { csrf_token } = usePage().props
    
    // Get workflow id from URL query string
    const urlParams = new URLSearchParams(window.location.search);
    const workflowId = urlParams.get('id');
    
    // Canvas reference
    const canvasRef = useRef(null);
    
    // Custom hooks
    const { 
        workflow, 
        isLoading, 
        error, 
        isDraftOpen, 
        setIsDraftOpen, 
        justSaved,
        saveWorkflow, 
        saveCanvas 
    } = useWorkflow(workflowId);
    
    const { loadCanvasData, clearCanvas, getCanvasData } = useWorkflowCanvas(canvasRef, workflowId);
    
    // Load canvas data when workflow data is available
    useEffect(() => {
        if (workflow && canvasRef.current) {
            loadCanvasData();
        }
    }, [workflow]);
    
    // Send desktop notification as a fallback when push notification fails
    const sendDesktopNotification = (title, body) => {
        // Check if the browser supports notifications
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
            return;
        }
        
        // Let's check whether notification permissions have already been granted
        if (Notification.permission === "granted") {
            // If it's okay let's create a notification
            new Notification(title, {
                body: body,
                icon: '/logo.png'
            });
        } 
        // Otherwise, we need to ask the user for permission
        else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                // If the user accepts, let's create a notification
                if (permission === "granted") {
                    new Notification(title, {
                        body: body,
                        icon: '/logo.png'
                    });
                }
            });
        }
    };
    
    // Handle save workflow
    const handleSave = async () => {
        if (!canvasRef.current) return;
        
        const canvasData = getCanvasData();
        if (!canvasData) return;
        
        // Save workflow first
        const result = await saveWorkflow(canvasData);
        
        if (result?.success) {
            // Update URL for new workflows
            if (result.workflowId !== workflowId) {
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('id', result.workflowId);
                window.history.pushState({}, '', newUrl);
            }
            
            // Save canvas data
            await saveCanvas(result.workflowId, canvasData);
            
            const notificationTitle = 'Workflow Saved';
            const notificationBody = `Your workflow "${workflow?.name || 'New workflow'}" has been saved successfully!`;
            
            // Try to send push notification via server
            try {
                await axios.post('/api/push-notify', {
                    title: notificationTitle,
                    body: notificationBody
                }, {
                    headers: {
                        'X-CSRF-TOKEN': csrf_token
                    }
                });
                console.log('Push notification sent successfully');
            } catch (error) {
                console.error('Failed to send push notification:', error);
                
                // Show error only in development
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Push notification error details:', error.response?.data || error.message);
                }
                
                // Fallback to desktop notification
                sendDesktopNotification(notificationTitle, notificationBody);
                
                // Show toast notification as last resort
                toast.success(`${notificationTitle}: ${notificationBody}`);
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
                    <div className="flex flex-col justify-center items-center h-64">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mb-3"></div>
                        <p className="text-gray-600 font-medium">Loading workflow...</p>
                    </div>
                ) : (
                    <>
                        <WorkflowControls 
                            workflow={workflow}
                            isDraftOpen={isDraftOpen}
                            setIsDraftOpen={setIsDraftOpen}
                            justSaved={justSaved}
                            onSave={handleSave}
                            onClearCanvas={clearCanvas}
                        />
                        
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
