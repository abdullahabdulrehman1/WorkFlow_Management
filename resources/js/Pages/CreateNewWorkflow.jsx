import { useState, useRef } from 'react'
import WorkflowLayout from '../components/layout/WorkflowLayout'
import WorkflowCanvas from '../components/layout/canvas/WorkflowCanvas'
import ActionDialog from '../components/actionDialog'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import WorkflowCanvasWrapper from '../components/layout/canvas/WorkflowCanvasWrapper'
import { Switch } from '@headlessui/react'

export default function CreateNewWorkflow () {
    const [isDraftOpen, setIsDraftOpen] = useState(false)
    const canvasRef = useRef(null)
    
    const handleClearCanvas = () => {
        if (canvasRef.current) {
            canvasRef.current.clearCanvas()
        }
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <WorkflowLayout breadcrumbText='Create New Workflow'>
                <div className='flex justify-between items-center mb-4'>
                    <div className='flex gap-4 items-center'>
                        <button 
                            className='text-red-500 border border-red-300 px-4 py-1 rounded-full text-sm font-medium hover:bg-red-50'
                            onClick={handleClearCanvas}
                        >
                            Clear canvas
                        </button>
                        <Switch
                            checked={isDraftOpen}
                            onChange={setIsDraftOpen}
                            className={`${
                                isDraftOpen ? 'bg-blue-500' : 'bg-gray-200'
                            } relative inline-flex h-6 w-11 items-center rounded-full`}
                        >
                            <span
                                className={`${
                                    isDraftOpen
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                            />
                        </Switch>
                        <span className='text-sm font-medium'>
                            {isDraftOpen ? 'Published' : 'Draft'}
                        </span>
                    </div>
                    <div className='flex gap-2'>
                        <button className='border px-4 py-1 rounded-full text-sm font-medium'>
                            Cancel
                        </button>
                        <button className='bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-semibold shadow'>
                            Save workflow
                        </button>
                    </div>
                </div>
                <div className='flex gap-4 relative'>
                    <div className='flex-1'>
                        <WorkflowCanvasWrapper ref={canvasRef} />
                    </div>
                    <div className='absolute top-0 right-0'>
                        <ActionDialog />
                    </div>
                </div>
            </WorkflowLayout>
        </DndProvider>
    )
}
