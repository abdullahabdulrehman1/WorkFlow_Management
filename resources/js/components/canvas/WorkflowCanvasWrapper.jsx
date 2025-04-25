import { Transition } from '@headlessui/react';
import { ReactFlowProvider } from '@xyflow/react';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import WorkflowCanvas from './WorkflowCanvas';
import { useAutoSaveCanvas } from './hooks';


const WorkflowCanvasWrapper = forwardRef((props, ref) => {
  const { workflowId, workflowName, triggerName, triggerID } = props;
  const canvasRef = useRef(null);
  
  const { isLoading, lastSaved, justSaved, error } = useAutoSaveCanvas(workflowId, canvasRef);
  
  // Forward methods from WorkflowCanvas to parent components
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    },
    getCanvasData: () => {
      if (canvasRef.current && canvasRef.current.getCanvasData) {
        return canvasRef.current.getCanvasData();
      }
      // Default empty data structure if method doesn't exist or ref is null
      return { 
        nodes: [], 
        edges: [],
        actions: [],
        connections: []
      };
    },
    loadCanvas: (data) => {
      if (canvasRef.current && canvasRef.current.loadCanvas) {
        canvasRef.current.loadCanvas(data);
      }
    }
  }));

  return (
    <ReactFlowProvider>

      <Transition
        show={isLoading}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 font-medium">Loading workflow canvas...</p>
          </div>
        </div>
      </Transition>

      <WorkflowCanvas 
        ref={canvasRef} 
        workflowId={workflowId} 
        workflowName={workflowName} 
        triggerName={triggerName} 
        triggerID={triggerID} 
      />
      
      {/* Error indicator */}
      {error && (
        <div className="absolute bottom-2 left-2 text-xs text-white bg-red-500 px-2 py-1 rounded-md">
          {error}
        </div>
      )}
    </ReactFlowProvider>
  );
});

export default WorkflowCanvasWrapper;