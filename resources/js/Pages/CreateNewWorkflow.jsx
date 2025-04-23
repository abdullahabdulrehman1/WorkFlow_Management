import { useState } from 'react';
import WorkflowLayout from '../components/layout/WorkflowLayout';
import WorkflowCanvas from '../components/layout/canvas/WorkflowCanvas';
import ActionDialog from '../components/actionDialog';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import WorkflowCanvasWrapper from '../components/layout/canvas/WorkflowCanvasWrapper';

export default function CreateNewWorkflow() {
  const [isDraftOpen, setIsDraftOpen] = useState(false);

  return (
    <DndProvider backend={HTML5Backend}>
      <WorkflowLayout breadcrumbText="Create New Workflow">
        {/* Header Controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 items-center">
            <button className="text-red-500 border border-red-300 px-4 py-1 rounded-full text-sm font-medium">
              Clear canvas
            </button>
            <span className="text-sm font-medium">Draft</span>
            <button   
              className="text-sm font-medium border px-2 py-1 rounded-full"
              onClick={() => setIsDraftOpen(!isDraftOpen)}
            >
              {isDraftOpen ? 'Close' : 'Open'}
            </button>
          </div>
          <div className="flex gap-2">
            <button className="border px-4 py-1 rounded-full text-sm font-medium">Cancel</button>
            <button className="bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold shadow">
              Save workflow
            </button>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex gap-4 relative">
          <div className="flex-1">
            <WorkflowCanvasWrapper />
          </div>

          {/* Action Dialog */}
          <div className="absolute top-0 right-0">
            <ActionDialog />
          </div>
        </div>
      </WorkflowLayout>
    </DndProvider>
  );
}
