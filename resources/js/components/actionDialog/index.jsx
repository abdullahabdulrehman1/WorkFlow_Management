import React, { useState } from 'react'
import { ChevronRight } from 'lucide-react'

const ActionDialog = ({ isOpen = true, onClose }) => {
    const [isVisible, setIsVisible] = useState(true)

    const toggleVisibility = () => {
        setIsVisible(!isVisible)
    }

    if (!isOpen) return null

    const actions = [
        { label: 'Send email', type: 'action' },
        { label: 'Send SMS', type: 'action' },
        { label: 'In-app notification', type: 'action' }
    ]

    return (
        <div className='relative'>
            {!isVisible && (
                <button
                    onClick={toggleVisibility}
                    className='absolute top-2 right-1 p-2 bg-white rounded-full shadow hover:bg-gray-100 z-50'
                >
                    <ChevronRight className='text-blue-500' />
                </button>
            )}

            {isVisible && (
                <div className='absolute top-4 right-4 w-[280px] bg-white border shadow-lg rounded-xl p-4 flex flex-col gap-4'>
                    <button
                        onClick={toggleVisibility}
                        className='absolute top-2 right-1 p-2 bg-white rounded-full shadow hover:bg-gray-100 z-50'
                    >
                        <ChevronRight className='text-blue-500 rotate-180' />
                    </button>
                    <h2 className='text-sm font-semibold text-gray-600'>
                        Actions
                    </h2>
                    <div className='flex items-center border rounded-full px-3 py-1 bg-blue-100'>
                        <input
                            type='text'
                            placeholder='Search actions'
                            className='bg-transparent text-sm flex-1 outline-none'
                        />
                        <button className='ml-2 text-sky-600'>🔍</button>
                    </div>
                    <div className='flex flex-col gap-2 overflow-y-auto'>
                        {actions.map((action, i) => (
                            <div
                                key={i}
                                className='p-3 rounded-lg shadow-sm border bg-yellow-50 text-xs text-gray-700 hover:bg-yellow-100 cursor-pointer'
                                draggable
                                onDragStart={e => {
                                    console.log('Drag started with:', {
                                        label: action.label,
                                        type: action.type
                                    });
                                    e.dataTransfer.setData(
                                        'application/reactflow',
                                        JSON.stringify({
                                            label: action.label,
                                            type: action.type
                                        })
                                    );
                                    e.dataTransfer.effectAllowed = 'move';
                                }}
                            >
                                <strong>{action.label}</strong>
                                <div className='text-[10px] text-gray-500'>
                                    Description about{' '}
                                    {action.label.toLowerCase()}
                                </div>
                            </div>
                        ))}
                    </div>
                   
                </div>
            )}
        </div>
    )
}

export default ActionDialog
