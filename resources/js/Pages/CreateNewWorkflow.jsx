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

export default function CreateNewWorkflow() {
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
