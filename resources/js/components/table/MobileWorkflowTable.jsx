import React from 'react'
import Dropdown from '../dropdown/index'
import { Calendar, Clock, Tag, ArrowRight } from 'lucide-react'

/**
 * Mobile-optimized version of the WorkflowTable
 * Displays each workflow as a beautiful card instead of a table row
 */
const MobileWorkflowTable = ({ workflows, onNavigate, onActionClick }) => {
    // Handle card click to navigate to canvas
    const handleCardClick = workflow => {
        if (onNavigate) {
            onNavigate(workflow)
        }
    }

    // Handle dropdown actions
    const handleActionClick = (action, workflow) => {
        if (onActionClick) {
            onActionClick(action, workflow)
        }
    }

    // Get appropriate colors based on workflow status
    const getStatusColors = status => {
        switch (status) {
            case 'published':
                return {
                    bg: 'bg-green-100',
                    text: 'text-green-700',
                    border: 'border-green-300',
                    icon: 'bg-green-500'
                }
            case 'draft':
                return {
                    bg: 'bg-yellow-100',
                    text: 'text-yellow-700',
                    border: 'border-yellow-300',
                    icon: 'bg-yellow-500'
                }
            default:
                return {
                    bg: 'bg-gray-100',
                    text: 'text-gray-500',
                    border: 'border-gray-300',
                    icon: 'bg-gray-400'
                }
        }
    }

    return (
        <div className='space-y-4 h-[450px] overflow-auto flex flex-col pb-2'>
            {workflows.length > 0 ? (
                <div className='grid grid-cols-1 gap-4'>
                    {workflows.map((workflow, index) => {
                        const statusColors = getStatusColors(workflow.status)
                        return (
                            <div
                                key={workflow.id || index}
                                className='bg-white border border-blue-400 rounded-2xl shadow-md overflow-hidden relative'
                            >
                                {/* Colorful status indicator at the top */}
                                {/* <div className={`h-1.5 w-full ${statusColors.bg}`}></div> */}

                                {/* Header with name and dropdown */}
                                <div className='flex justify-between items-center px-4 pt-3 pb-2'>
                                    <h3 className='font-medium text-lg text-blue-800'>
                                        {workflow.name}
                                    </h3>
                                    <div
                                        className='relative overflow-visible z-10'
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <Dropdown
                                            actions={[
                                                'Rename',
                                                'Edit',
                                                'Delete'
                                            ]}
                                            onActionClick={action =>
                                                handleActionClick(
                                                    action,
                                                    workflow
                                                )
                                            }
                                            item={workflow}
                                        />
                                    </div>
                                </div>

                                {/* Status tag */}
                                <div className='px-4 pb-2'>
                                    <div className='flex items-center space-x-1'>
                                        <div
                                            className={`w-2 h-2 rounded-full ${statusColors.icon}`}
                                        ></div>
                                        <span
                                            className={`text-xs font-medium ${statusColors.text}`}
                                        >
                                            {workflow.status
                                                ? workflow.status
                                                      .charAt(0)
                                                      .toUpperCase() +
                                                  workflow.status.slice(1)
                                                : 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                {/* Metadata with nice icons */}
                                <div className='px-4 pb-3 grid grid-cols-2 gap-y-2 text-sm text-gray-500'>
                                    <div className='flex items-center space-x-2'>
                                        <Calendar className='w-4 h-4 text-blue-400' />
                                        <span className='text-xs'>
                                            Created:
                                        </span>
                                    </div>
                                    <div className='text-xs text-right'>
                                        {workflow.created_at_formatted ||
                                            'Not Available'}
                                    </div>

                                    <div className='flex items-center space-x-2'>
                                        <Clock className='w-4 h-4 text-blue-400' />
                                        <span className='text-xs'>
                                            Updated:
                                        </span>
                                    </div>
                                    <div className='text-xs text-right'>
                                        {workflow.updated_at_formatted ||
                                            'Not Available'}
                                    </div>
                                </div>

                                {/* View button at the bottom */}
                                <div
                                    className='bg-blue-50 px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition-colors border-t border-blue-100'
                                    onClick={() => handleCardClick(workflow)}
                                >
                                    <span className='text-sm font-medium text-blue-700'>
                                        View Workflow
                                    </span>
                                    <ArrowRight className='w-4 h-4 text-blue-500' />
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className='text-center py-12 bg-white border border-blue-200 rounded-xl flex flex-col items-center justify-center gap-2 flex-1'>
                    <Tag className='w-10 h-10 text-blue-300' />
                    <p className='text-gray-500'>No workflows found</p>
                    <p className='text-xs text-gray-400'>
                        Create a new workflow to get started
                    </p>
                </div>
            )}
        </div>
    )
}

export default MobileWorkflowTable
