import React from 'react'
import Dropdown from '@/Components/Dropdown'

const actions = ['Draft Status', 'Duplicate', 'Rename', 'Edit', 'Delete']

const WorkflowTable = ({ workflows }) => {
    return (
        <div className='space-y-4'>
            {/* Header Row */}
            <div className='grid grid-cols-1 sm:grid-cols-5 bg-blue-300 backdrop-blur-md text-gray-900 font-semibold rounded-xl shadow px-6 py-3 text-sm border-b border-blue-500'>
                <div className='text-left col-span-1 rounded-tl-xl border-r border-blue-500'>
                    Workflow Name
                </div>
                <div className='text-center col-span-1 border-r border-blue-500'>
                    Created On
                </div>
                <div className='text-center col-span-1 border-r border-blue-500'>
                    Last Updated
                </div>
                <div className='text-center col-span-1 border-r border-blue-500'>
                    Status
                </div>
                <div className='text-center col-span-1 rounded-tr-xl'>
                    Actions
                </div>
            </div>

            {/* Data Rows */}
            {workflows.map((workflow, index) => (
                <div
                    key={index}
                    className='grid grid-cols-1 sm:grid-cols-5 items-center bg-white border border-blue-200 rounded-xl shadow-sm px-6 py-2 hover:bg-blue-50 transition'
                >
                    <div className='text-left font-medium'>
                        {workflow.name}
                    </div>
                    <div className='text-center'>{workflow.createdOn}</div>
                    <div className='text-center'>
                        {workflow.lastUpdated || 'Not Available'}
                    </div>
                    <div className='text-center'>
                        <span
                            className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${
                                workflow.status === 'Published'
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : 'bg-gray-100 text-gray-500 border-gray-300'
                            }`}
                        >
                            {workflow.status}
                        </span>
                    </div>
                    <div className='text-center relative overflow-visible'>
                        <Dropdown actions={actions} />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default WorkflowTable
