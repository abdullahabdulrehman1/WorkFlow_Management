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
    
    // Function to show desktop notifications
    const showDesktopNotification = (title, body) => {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
            return false;
        }
        
        if (Notification.permission === "granted") {
            try {
                const notification = new Notification(title, {
                    body: body,
                    icon: '/logo.png',
                    tag: 'workflow-notification-' + Date.now(),
                    requireInteraction: true,
                    silent: false
                });
                notification.onclick = function() {
                    window.focus();
                    this.close();
                };
                return true;
            } catch (error) {
                console.error("Error showing notification:", error);
                return false;
            }
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    showDesktopNotification(title, body);
                    return true;
                }
            });
        }
        
        return false;
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
            if (result.workflowId !== workflowId && result.workflowId) {
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('id', result.workflowId);
                window.history.pushState({}, '', newUrl);
            }
            
            // Save canvas data
            await saveCanvas(result.workflowId || workflowId, canvasData);
            
            const notificationTitle = 'Workflow Saved';
            const notificationBody = `Your workflow "${workflow?.name || 'New workflow'}" has been saved successfully!`;
            
            let notificationShown = false;
            
            // Try to send push notification via server first
            try {
                const response = await axios.post('/api/push-notify', {
                    title: notificationTitle,
                    body: notificationBody,
                    url: window.location.href
                }, {
                    headers: {
                        'X-CSRF-TOKEN': csrf_token
                    }
                });
                
                console.log('Push notification response:', response.data);
                
                // If server-side push was successful
                if (response.data && response.data.sent) {
                    notificationShown = true;
                    console.log('Server-side push notification sent successfully');
                } 
                // If server indicates we should use fallback or push failed
                else if (response.data && response.data.fallbackEnabled) {
                    console.log('Server recommended using fallback notification');
                    notificationShown = showDesktopNotification(notificationTitle, notificationBody);
                }
            } catch (error) {
                console.error('Error with push notification:', error);
            }
            
            // Show toast notification if neither method worked
            if (!notificationShown) {
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
