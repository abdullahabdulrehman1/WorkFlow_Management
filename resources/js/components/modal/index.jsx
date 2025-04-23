import React, { useEffect } from 'react'
import ReusableButton from '@/Components/Button'

const Modal = ({ isOpen, onClose }) => {
    if (!isOpen) return null

    // Close modal when clicking outside
    useEffect(() => {
        function handleClickOutside (event) {
            const modalContent = document.getElementById('modalContent')
            if (modalContent && !modalContent.contains(event.target)) {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [onClose])

    return (
        <div className='fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50'>
            <div
                id='modalContent'
                className='bg-white rounded-4xl px-5 shadow-lg w-full max-w-lg border border-blue-200'
            >
                {/* Modal Header */}
                <div className='bg-blue-300 text-gray-900  text-center py-3 px-2 m-2 rounded-4xl border-b border-blue-300'>
                    <h2 className='text-md font-bold '>Create Workflow</h2>
                </div>

                {/* Modal Body */}
                <div className='p-6 space-y-4'>
                    <div className='mb-4'>
                        <label
                            htmlFor='workflowName'
                            className='block text-gray-700 font-medium mb-2'
                        >
                            Workflow name
                        </label>
                        <input
                            type='text'
                            id='workflowName'
                            placeholder='Type workflow name'
                            className='w-full border border-blue-300 rounded-4xl px-4 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                    </div>
                    <div className='mb-6'>
                        <label
                            htmlFor='trigger'
                            className='block text-gray-700 font-medium mb-2'
                        >
                            Trigger
                        </label>
                        <select
                            id='trigger'
                            className='w-full border border-blue-300 rounded-4xl px-4 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                            <option value=''>Select a trigger</option>

                            <option value='trigger1'>Trigger 1</option>

                            <option value='trigger2'>Trigger 2</option>
                        </select>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className='flex justify-end items-center px-6 py-4 space-x-4'>
                    <ReusableButton
                        onClick={onClose}
                        className='border-gray-400 border bg-white text-gray-700 hover:bg-gray-200'
                    >
                        Cancel
                    </ReusableButton>
                    <ReusableButton className='border-yellow-400 bg-yellow-500 text-white hover:bg-yellow-600'>
                        Create Workflow
                    </ReusableButton>
                </div>
            </div>
        </div>
    )
}

export default Modal
