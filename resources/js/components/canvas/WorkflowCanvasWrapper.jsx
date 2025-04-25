import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Transition } from '@headlessui/react';
import WorkflowCanvas from './WorkflowCanvas';
import { useAutoSaveCanvas } from './hooks';

/**
 * Wrapper component for WorkflowCanvas that provides ReactFlow context
 * and forwards methods from WorkflowCanvas to parent components
 */
const WorkflowCanvasWrapper = forwardRef((props, ref) => {
  const { workflowId, workflowName, triggerName, triggerID } = props;
  const canvasRef = useRef(null);
  
  // Use auto-save hook to automatically save and load canvas data
  const { isLoading, lastSaved, error } = useAutoSaveCanvas(workflowId, canvasRef);
  
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
      {/* Loading overlay */}
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
      
      {/* Last saved indicator (only shown when not loading and when there was a successful save) */}
      {!isLoading && lastSaved && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded-md">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}
      
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