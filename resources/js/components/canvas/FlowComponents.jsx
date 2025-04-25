import React from 'react';
import { Background, Controls, MiniMap } from '@xyflow/react';


export const FlowBackground = () => (
  <Background
    variant='dots'
    gap={32}
    size={1.5}
    color='black'
    className='opacity-50'
  />
);

export const FlowControls = () => (
  <Controls showInteractive={false} position='top-left' />
);


export const FlowMiniMap = () => (
  <MiniMap
    nodeColor={n => n.type === 'trigger' ? '#fb923c' : '#facc15'}
    position='bottom-left'
  />
);

export const DropIndicator = () => (
  <div className='absolute inset-0 flex items-center justify-center text-blue-500 font-semibold pointer-events-none'>
    Drop here to add action
  </div>
);

export const WorkflowNameDisplay = ({ workflowName }) => (
  workflowName && (
    <div className="absolute top-2 right-2 z-10 bg-blue-100 px-3 py-1 rounded-full text-sm font-medium">
      {workflowName}
    </div>
  )
);