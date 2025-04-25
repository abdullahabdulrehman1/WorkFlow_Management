import React, { useEffect, useState } from 'react'
import ReusableButton from '@/Components/Button'

const Modal = ({ isOpen, onClose, onSubmit, triggers = [], mode = 'create', workflow = null }) => {
    const [workflowName, setWorkflowName] = useState('')
    const [selectedTriggerId, setSelectedTriggerId] = useState('')
    const [errors, setErrors] = useState({})

    // Reset form when modal opens/closes or when mode/workflow changes
    useEffect(() => {
        if (isOpen) {
            if (workflow && (mode === 'rename' || mode === 'delete')) {
                setWorkflowName(workflow.name || '')
                setSelectedTriggerId(workflow.trigger_id || '')
            } else {
                setWorkflowName('')
                setSelectedTriggerId('')
            }
            setErrors({})
        }
    }, [isOpen, workflow, mode])

    // Close modal when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            const modalContent = document.getElementById('modalContent')
            if (modalContent && !modalContent.contains(event.target)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
        return undefined
    }, [onClose, isOpen])

    // Early return after all hooks have been declared
    if (!isOpen) return null

    // Handle form submission based on mode
    const handleSubmit = () => {
        if (mode === 'delete') {
            // No validation needed for delete
            onSubmit(workflow)
                .then(() => {
                    onClose() // Close modal on success
                })
                .catch(err => {
                    console.error('Error deleting workflow:', err)
                })
            return
        }

        // Validation for create and rename modes
        const newErrors = {}
        if (!workflowName.trim()) {
            newErrors.name = 'Workflow name is required'
        }
        
        // Trigger is required only for create mode
        if (mode === 'create' && !selectedTriggerId) {
            newErrors.trigger = 'Please select a trigger'
        }

        // If there are errors, show them
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        // Submit the form if valid
        if (onSubmit) {
            if (mode === 'rename') {
                // For rename, we only need to submit the name
                onSubmit({ ...workflow, name: workflowName })
                    .then(() => {
                        onClose() // Close modal on success
                    })
                    .catch(err => {
                        // Handle API errors
                        if (err.response?.data?.errors) {
                            setErrors(err.response.data.errors)
                        } else {
                            console.error('Error renaming workflow:', err)
                        }
                    })
            } else {
                // For create, submit all workflow data
                const workflowData = {
                    name: workflowName,
                    trigger_id: selectedTriggerId,
                    status: 'draft' // Default status
                }
                onSubmit(workflowData)
                    .then(() => {
                        onClose() // Close modal on success
                    })
                    .catch(err => {
                        // Handle API errors
                        if (err.response?.data?.errors) {
                            setErrors(err.response.data.errors)
                        } else {
                            console.error('Error creating workflow:', err)
                        }
                    })
            }
        }
    }

    // Determine title based on mode
    const getModalTitle = () => {
        switch(mode) {
            case 'create': return 'Create Workflow';
            case 'rename': return 'Rename Workflow';
            case 'delete': return 'Delete Workflow';
            default: return 'Workflow';
        }
    }

    // Determine submit button text based on mode
    const getSubmitButtonText = () => {
        switch(mode) {
            case 'create': return 'Create Workflow';
            case 'rename': return 'Update Name';
            case 'delete': return 'Delete';
            default: return 'Submit';
        }
    }

    // Determine submit button styling based on mode
    const getSubmitButtonClass = () => {
        if (mode === 'delete') {
            return 'border border-red-400 bg-red-500  text-black hover:bg-red-600 hover:text-white'; 
        }
        return 'border-yellow-400 bg-yellow-500 text-white hover:bg-yellow-600';
    }

    return (
        <div className='fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50'>
            <div
                id='modalContent'
                className='bg-white rounded-4xl px-5 shadow-lg w-full max-w-lg border border-blue-200'
            >
                {/* Modal Header */}
                <div className='bg-blue-300 text-gray-900 text-center py-3 px-2 m-2 rounded-4xl border-b border-blue-300'>
                    <h2 className='text-md font-bold'>{getModalTitle()}</h2>
                </div>

                {/* Modal Body */}
                <div className='p-6 space-y-4'>
                    {mode === 'delete' ? (
                        <div className="text-center mb-4">
                            <p className="text-gray-700 mb-2">Are you sure you want to delete the workflow:</p>
                            <p className="font-bold text-lg mb-4">{workflow?.name}</p>
                            <p className="text-red-600 text-sm">This action cannot be undone.</p>
                        </div>
                    ) : (
                        <>
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
                                    className={`w-full border ${errors.name ? 'border-red-500' : 'border-blue-300'} rounded-4xl px-4 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    value={workflowName}
                                    onChange={(e) => setWorkflowName(e.target.value)}
                                />
                                {errors.name && (
                                    <p className='text-red-500 text-xs mt-1'>{errors.name}</p>
                                )}
                            </div>
                            {mode === 'create' && (
                                <div className='mb-6'>
                                    <label
                                        htmlFor='trigger'
                                        className='block text-gray-700 font-medium mb-2'
                                    >
                                        Trigger
                                    </label>
                                    <select
                                        id='trigger'
                                        className={`w-full border ${errors.trigger ? 'border-red-500' : 'border-blue-300'} rounded-4xl px-4 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                        value={selectedTriggerId}
                                        onChange={(e) => setSelectedTriggerId(e.target.value)}
                                    >
                                        <option value=''>Select a trigger</option>
                                        {triggers.map((trigger) => (
                                            <option key={trigger.id} value={trigger.id}>
                                                {trigger.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.trigger && (
                                        <p className='text-red-500 text-xs mt-1'>{errors.trigger}</p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Modal Footer */}
                <div className='flex justify-end items-center px-6 py-4 space-x-4'>
                    <ReusableButton
                        onClick={onClose}
                        className='border-gray-400 border bg-white text-gray-700 hover:bg-gray-200'
                    >
                        Cancel
                    </ReusableButton>
                    <ReusableButton 
                        onClick={handleSubmit}
                        className={getSubmitButtonClass()}
                    >
                        {getSubmitButtonText()}
                    </ReusableButton>
                </div>
            </div>
        </div>
    )
}

export default Modal
