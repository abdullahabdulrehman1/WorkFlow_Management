import { Filter, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'
import { toast } from 'react-hot-toast'

import ReusableButton from '../components/button'
import { DropdownProvider } from '../components/context/DropdownContext'
import WorkflowLayout from '../components/layout/WorkflowLayout'
import Modal from '../components/modal'
import Pagination from '../components/pagination/pagination'
import { IconButton, SearchInput } from '../components/reusable'
import WorkflowTable from '../components/table'
import MobileWorkflowTable from '../components/table/MobileWorkflowTable'
import useIsMobile from '../hooks/useIsMobile'

export default function Workflows () {
    // Use the mobile detection hook
    const isMobile = useIsMobile();
    
    // Console log to verify if mobile detection is working
    useEffect(() => {
        console.log('Is mobile device:', isMobile);
    }, [isMobile]);

    // State management
    const [state, setState] = useState({
        search: '',
        activeTab: 'workflows',
        currentPage: 1,
        isModalOpen: false,
        modalMode: 'create',
        selectedWorkflow: null,
        workflows: [],
        triggers: [],
        loading: true,
        error: null,
        pagination: { total: 0, perPage: 5, currentPage: 1, lastPage: 1 }
    })

    // Destructuring for cleaner code
    const {
        search,
        activeTab,
        currentPage,
        isModalOpen,
        modalMode,
        selectedWorkflow,
        workflows,
        triggers,
        loading,
        error,
        pagination
    } = state

    // Helper function to update state
    const updateState = updates => setState(prev => ({ ...prev, ...updates }))

    // Format date helper
    const formatDate = dateString =>
        dateString ? new Date(dateString).toLocaleString() : ''

    // API calls with consolidated error handling
    const apiCall = async (method, endpoint, data = null, params = null) => {
        try {
            const config = { ...(params && { params }) }
            const response =
                method === 'get'
                    ? await axios.get(endpoint, config)
                    : method === 'post'
                    ? await axios.post(endpoint, data)
                    : method === 'put'
                    ? await axios.put(endpoint, data)
                    : await axios.delete(endpoint)

            return { success: true, data: response.data }
        } catch (err) {
            console.error(`API error (${method} ${endpoint}):`, err)
            return { success: false, error: err }
        }
    }

    // Fetch workflows from the API
    const fetchWorkflows = async (page = currentPage, searchQuery = search) => {
        updateState({ loading: true })
        const {
            success,
            data,
            error: apiError
        } = await apiCall('get', '/api/workflows', null, {
            page,
            search: searchQuery,
            per_page: pagination.perPage
        })

        if (success) {
            const formattedWorkflows = data.workflows.data.map(workflow => ({
                ...workflow,
                created_at_formatted: formatDate(workflow.created_at),
                updated_at_formatted: formatDate(workflow.updated_at)
            }))

            updateState({
                workflows: formattedWorkflows,
                pagination: {
                    total: data.workflows.total,
                    perPage: data.workflows.per_page,
                    currentPage: data.workflows.current_page,
                    lastPage: data.workflows.last_page
                },
                loading: false
            })
        } else {
            updateState({ error: 'Failed to load workflows', loading: false })
        }
    }

    // Workflow CRUD operations
    const workflowOperations = {
        create: async data => {
            const result = await apiCall('post', '/api/workflows', data)
            if (result.success) {
                fetchWorkflows()
                toast?.success('Workflow created successfully') ||
                    alert('Workflow created successfully')
                return result.data
            } else {
                toast?.error('Failed to create workflow') ||
                    alert('Failed to create workflow')
                throw result.error
            }
        },

        delete: async workflow => {
            const result = await apiCall(
                'delete',
                `/api/workflows/${workflow.id}`
            )
            if (result.success) {
                fetchWorkflows()
                toast?.success('Workflow deleted successfully') ||
                    alert('Workflow deleted successfully')
                return { success: true }
            } else {
                toast?.error('Failed to delete workflow') ||
                    alert('Failed to delete workflow')
                throw result.error
            }
        },

        rename: async workflow => {
            const result = await apiCall(
                'put',
                `/api/workflows/${workflow.id}`,
                {
                    name: workflow.name,
                    trigger_id: workflow.trigger_id,
                    status: workflow.status || 'draft'
                }
            )
            if (result.success) {
                fetchWorkflows()
                toast?.success('Workflow renamed successfully') ||
                    alert('Workflow renamed successfully')
                return result.data
            } else {
                toast?.error('Failed to rename workflow') ||
                    alert('Failed to rename workflow')
                throw result.error
            }
        }
    }

    // UI interaction handlers
    const handlers = {
        openModal: (mode, workflow = null) => {
            updateState({
                modalMode: mode,
                selectedWorkflow: workflow,
                isModalOpen: true
            })
        },

        workflowAction: (action, workflow) => {
            if (action === 'Delete') handlers.openModal('delete', workflow)
            else if (action === 'Rename') handlers.openModal('rename', workflow)
            else if (action === 'Edit')
                router.visit(`/create-new-workflow?id=${workflow.id}`)
            else
                console.log(
                    `Action ${action} not implemented for workflow ${workflow.id}`
                )
        },

        modalSubmit: data => workflowOperations[modalMode](data)
    }

    // Initialize data and handle window resizing
    useEffect(() => {
        fetchWorkflows(1)
        apiCall('get', '/triggers').then(result => {
            if (result.success)
                updateState({ triggers: result.data.triggers || [] })
        })
    }, [])

    // Handle search and pagination
    useEffect(() => {
        fetchWorkflows(currentPage, search)
    }, [currentPage, search])

    // Loading state
    if (loading && workflows.length === 0) {
        return (
            <DropdownProvider>
                <WorkflowLayout breadcrumbText='Workflows'>
                    <div className='flex justify-center items-center h-64'>
                        <p>Loading workflows...</p>
                    </div>
                </WorkflowLayout>
            </DropdownProvider>
        )
    }

    return (
        <DropdownProvider>
            <WorkflowLayout breadcrumbText='Workflows'>
                {error && (
                    <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4'>
                        {error}
                    </div>
                )}

                <div
                    className={`flex justify-between items-center mb-4 ${
                        isMobile ? 'flex-col gap-4' : ''
                    }`}
                >
                    <ReusableButton
                        onClick={() => handlers.openModal('create')}
                        isActive={true}
                    >
                        + Build New Workflow
                    </ReusableButton>

                    <div
                        className={`flex gap-2 items-center ${
                            isMobile ? 'flex-col w-full' : ''
                        }`}
                    >
                        <div
                            className={`flex gap-2 ${
                                isMobile ? 'flex-col w-full' : ''
                            }`}
                        >
                            <ReusableButton
                                onClick={() =>
                                    updateState({ activeTab: 'workflows' })
                                }
                                isActive={activeTab === 'workflows'}
                                className={isMobile ? 'w-full' : ''}
                            >
                                Workflows
                            </ReusableButton>
                            <ReusableButton
                                onClick={() =>
                                    updateState({ activeTab: 'executed' })
                                }
                                isActive={activeTab === 'executed'}
                                className={isMobile ? 'w-full' : ''}
                            >
                                Executed Workflows
                            </ReusableButton>
                        </div>
                        
                                                                                          {isMobile ? (
                                                <div className="w-full">
                                                    <div className="flex items-center w-full space-x-2">
                                                        <div className="relative flex-1">
                                                            <SearchInput
                                                                value={search}
                                                                onChange={e => updateState({ search: e.target.value })}
                                                                placeholder='Search'
                                                                className="w-full"
                                                            />
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <IconButton
                                                                icon={Search}
                                                                onClick={() => fetchWorkflows(1, search)}
                                                            />
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <IconButton
                                                                icon={Filter}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ): (
                            <div className="flex items-center">
                                <SearchInput
                                    value={search}
                                    onChange={e => updateState({ search: e.target.value })}
                                    placeholder='Search'
                                    className="w-auto mr-2"
                                />
                                <IconButton
                                    icon={Search}
                                    onClick={() => fetchWorkflows(1, search)}
                                    className="mr-1"
                                />
                                <IconButton icon={Filter} />
                            </div>
                        )}
                    </div>
                </div>

                <div className='overflow-visible relative z-[50] horizontal-scroll-hidden'>
                    {isMobile ? (
                        <MobileWorkflowTable
                            workflows={workflows}
                            onNavigate={workflow =>
                                router.visit(
                                    `/create-new-workflow?id=${workflow.id}`
                                )
                            }
                            onActionClick={handlers.workflowAction}
                        />
                    ) : (
                        <WorkflowTable
                            workflows={workflows}
                            onNavigate={workflow =>
                                router.visit(
                                    `/create-new-workflow?id=${workflow.id}`
                                )
                            }
                            onActionClick={handlers.workflowAction}
                        />
                    )}
                </div>

                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.lastPage}
                    onPageChange={newPage =>
                        updateState({ currentPage: newPage })
                    }
                />

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => updateState({ isModalOpen: false })}
                    onSubmit={handlers.modalSubmit}
                    triggers={triggers}
                    mode={modalMode}
                    workflow={selectedWorkflow}
                />
            </WorkflowLayout>
        </DropdownProvider>
    )
}
