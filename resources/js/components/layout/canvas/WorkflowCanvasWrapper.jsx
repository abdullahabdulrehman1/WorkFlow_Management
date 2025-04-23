import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './WorkflowCanvas';

export default function WorkflowCanvasWrapper() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}
