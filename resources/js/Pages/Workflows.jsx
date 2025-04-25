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
    const [modalMode, setModalMode] = useState('create') // 'create', 'rename', or 'delete'
    const [selectedWorkflow, setSelectedWorkflow] = useState(null)
    const [isMobile, setIsMobile] = useState(false)
    const [workflows, setWorkflows] = useState([])
    const [triggers, setTriggers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
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
            return { success: true };
        } catch (err) {
            console.error('Error deleting workflow:', err);
            toast?.error('Failed to delete workflow') || alert('Failed to delete workflow');
            throw err;
        }
    };
    
    // Rename a workflow
    const renameWorkflow = async (workflow) => {
        try {
            const response = await axios.put(`/api/workflows/${workflow.id}`, {
                name: workflow.name,
                trigger_id: workflow.trigger_id,
                status: workflow.status || 'draft'
            });
            fetchWorkflows(currentPage, search);
            toast?.success('Workflow renamed successfully') || alert('Workflow renamed successfully');
            return response.data;
        } catch (err) {
            console.error('Error renaming workflow:', err);
            toast?.error('Failed to rename workflow') || alert('Failed to rename workflow');
            throw err;
        }
    };
    
    // Open modal with specific mode and workflow data
    const openModal = (mode, workflow = null) => {
        setModalMode(mode);
        setSelectedWorkflow(workflow);
        setIsModalOpen(true);
    };
    
    // Handle workflow action from dropdown
    const handleWorkflowAction = (action, workflow) => {
        switch(action) {
            case 'Delete':
                openModal('delete', workflow);
                break;
            case 'Rename':
                openModal('rename', workflow);
                break;
            case 'Edit':
                navigateToCanvas(workflow);
                break;
            default:
                console.log(`Action ${action} not implemented for workflow ${workflow.id}`);
        }
    };
    
    // Handle modal submit based on current mode
    const handleModalSubmit = (data) => {
        switch(modalMode) {
            case 'create':
                return createWorkflow(data);
            case 'delete':
                return deleteWorkflow(data);
            case 'rename':
                return renameWorkflow(data);
            default:
                return Promise.reject(new Error('Invalid modal mode'));
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
                
                <div
                    className={`flex justify-between items-center mb-4 ${
                        isMobile ? 'flex-col gap-4' : ''
                    }`}
                >
                    <ReusableButton
                        onClick={() => openModal('create')}
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

                {/* Modal Integration - Now handles create, rename and delete */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    triggers={triggers}
                    mode={modalMode}
                    workflow={selectedWorkflow}
                />
            </WorkflowLayout>
        </DropdownProvider>
    )   
}
