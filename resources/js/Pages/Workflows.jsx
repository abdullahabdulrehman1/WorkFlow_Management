import { Filter, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { router } from '@inertiajs/react'

import ReusableButton from '../components/button'
import { DropdownProvider } from '../components/context/DropdownContext'
import WorkflowLayout from '../components/layout/WorkflowLayout'
import Modal from '../components/modal'
import Pagination from '../components/pagination/pagination'
import {
    IconButton,
    SearchInput
} from '../components/reusable'
import WorkflowTable from '../components/table'
import { toast } from 'react-hot-toast' // Import toast if available, or add it to your dependencies

export default function Workflows () {
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState('workflows')
    const [currentPage, setCurrentPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [workflows, setWorkflows] = useState([])
    const [triggers, setTriggers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null) // Store workflow to delete
    const [pagination, setPagination] = useState({
        total: 0,
        perPage: 5,
        currentPage: 1,
        lastPage: 1
    })

    // Fetch workflows from the API - Updated to format dates
    const fetchWorkflows = async (page = 1, searchQuery = '') => {
        setLoading(true)
        try {
            const response = await axios.get('/api/workflows', {
                params: {
                    page,
                    search: searchQuery,
                    per_page: pagination.perPage
                }
            })
            
            // Format dates for each workflow
            const formattedWorkflows = response.data.workflows.data.map(workflow => ({
                ...workflow,
                created_at_formatted: workflow.created_at ? new Date(workflow.created_at).toLocaleString() : '',
                updated_at_formatted: workflow.updated_at ? new Date(workflow.updated_at).toLocaleString() : ''
            }));
            
            setWorkflows(formattedWorkflows);
            setPagination({
                total: response.data.workflows.total,
                perPage: response.data.workflows.per_page,
                currentPage: response.data.workflows.current_page,
                lastPage: response.data.workflows.last_page
            })
        } catch (err) {
            console.error('Error fetching workflows:', err)
            setError('Failed to load workflows')
        } finally {
            setLoading(false)
        }
    }

    // Fetch triggers for the dropdown
    const fetchTriggers = async () => {
        try {
            const response = await axios.get('/triggers')
            setTriggers(response.data.triggers || [])
        } catch (err) {
            console.error('Error fetching triggers:', err)
        }
    }

    // Create a new workflow
    const createWorkflow = async (workflowData) => {
        try {
            const response = await axios.post('/api/workflows', workflowData)
            
            // Format dates if they exist
            if (response.data.workflow) {
                const workflow = response.data.workflow;
                if (workflow.created_at) {
                    workflow.created_at_formatted = new Date(workflow.created_at).toLocaleString();
                }
                if (workflow.updated_at) {
                    workflow.updated_at_formatted = new Date(workflow.updated_at).toLocaleString();
                }
            }
            
            // Add the new workflow to the list or refetch the list
            fetchWorkflows(currentPage, search)
            
            // Show success message
            toast?.success('Workflow created successfully') || alert('Workflow created successfully');
            
            return response.data
        } catch (err) {
            console.error('Error creating workflow:', err)
            toast?.error('Failed to create workflow') || alert('Failed to create workflow');
            throw err
        }
    }
    
    // Delete a workflow
    const deleteWorkflow = async (workflow) => {
        try {
            await axios.delete(`/api/workflows/${workflow.id}`);
            fetchWorkflows(currentPage, search);
            toast?.success('Workflow deleted successfully') || alert('Workflow deleted successfully');
            setConfirmDelete(null); // Clear confirmation
        } catch (err) {
            console.error('Error deleting workflow:', err);
            toast?.error('Failed to delete workflow') || alert('Failed to delete workflow');
        }
    };
    
    // Handle dropdown actions
    const handleWorkflowAction = (action, workflow) => {
        switch(action) {
            case 'Delete':
                setConfirmDelete(workflow);
                break;
            case 'Edit':
                navigateToCanvas(workflow);
                break;
            
            default:
                console.log(`Action ${action} not implemented for workflow ${workflow.id}`);
        }
    };
    
 
    
    // Navigate to canvas page using Inertia
    const navigateToCanvas = (workflow) => {
        router.visit(`/create-new-workflow?id=${workflow.id}`);
    };

    // Initial data loading
    useEffect(() => {
        fetchWorkflows(1)
        fetchTriggers()
    }, [])

    // Handle search and pagination
    useEffect(() => {
        fetchWorkflows(currentPage, search)
    }, [currentPage, search])

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }

        handleResize()
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage)
    }

    // If the data is still loading, show a loading indicator
    if (loading && workflows.length === 0) {
        return (
            <DropdownProvider>
                <WorkflowLayout breadcrumbText='Workflows'>
                    <div className="flex justify-center items-center h-64">
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
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}
                
                {/* Confirmation Dialog for Delete */}
                {confirmDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Confirm Delete</h3>
                            <p className="mb-6">Are you sure you want to delete workflow "{confirmDelete.name}"? This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button 
                                    className="px-4 py-2 bg-gray-200 rounded-md text-gray-800 hover:bg-gray-300"
                                    onClick={() => setConfirmDelete(null)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="px-4 py-2 bg-red-600 rounded-md text-white hover:bg-red-700"
                                    onClick={() => deleteWorkflow(confirmDelete)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <div
                    className={`flex justify-between items-center mb-4 ${
                        isMobile ? 'flex-col gap-4' : ''
                    }`}
                >
                    <ReusableButton
                        onClick={() => setIsModalOpen(true)}
                        isActive={true}
                    >
                        + Build New Workflow
                    </ReusableButton>
                    <div
                        className={`flex gap-2 items-center ${
                            isMobile ? 'flex-col' : ''
                        }`}
                    >
                        <div
                            className={`flex gap-2 ${
                                isMobile ? 'flex-col' : ''
                            }`}
                        >
                            <ReusableButton
                                onClick={() => setActiveTab('workflows')}
                                isActive={activeTab === 'workflows'}
                            >
                                Workflows
                            </ReusableButton>
                            <ReusableButton
                                onClick={() => setActiveTab('executed')}
                                isActive={activeTab === 'executed'}
                            >
                                Executed Workflows
                            </ReusableButton>
                        </div>
                        <SearchInput
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder='Search'
                        />
                        <IconButton 
                            icon={Search} 
                            onClick={() => fetchWorkflows(1, search)}
                        />
                        <IconButton icon={Filter} />
                    </div>
                </div>
                <div className='overflow-visible relative z-[50] horizontal-scroll-hidden'>
                    <WorkflowTable 
                        workflows={workflows} 
                        onNavigate={navigateToCanvas}
                        onActionClick={handleWorkflowAction}
                    />
                </div>

                <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.lastPage}
                    onPageChange={handlePageChange}
                />

                {/* Modal Integration */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={createWorkflow}
                    triggers={triggers}
                />
            </WorkflowLayout>
        </DropdownProvider>
    )   
}
