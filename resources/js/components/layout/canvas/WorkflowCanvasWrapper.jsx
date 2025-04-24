import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './WorkflowCanvas';

const WorkflowCanvasWrapper = forwardRef((props, ref) => {
  const canvasRef = useRef(null);
  
  // Forward the clearCanvas method from WorkflowCanvas to parent components
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    }
  }));

  return (
    <ReactFlowProvider>
      <WorkflowCanvas ref={canvasRef} />
    </ReactFlowProvider>
  );
});

export default WorkflowCanvasWrapper;
