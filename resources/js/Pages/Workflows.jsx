import React, { useState } from 'react'
import { Search, Filter, MoreVertical } from 'lucide-react'

import { Menu } from '@headlessui/react'
import TopNavbar from '../components/navbar'
import {
    Breadcrumb,
    Button,
    SearchInput,
    IconButton
} from '../components/reusable'
import WorkflowTable from '../components/table'
import Pagination from '../components/pagination/pagination'
import Sidebar from '../components/sidebar/index'
import Footer from '../components/footer'
import Modal from '../components/modal'
import ReusableButton from '../components/button'
import { DropdownProvider } from '../components/context/DropdownContext'

const workflows = Array.from({ length: 6 }, (_, i) => ({
    name: i % 2 === 0 ? 'Workflow of Whatsapp Trigger' : 'Workflow of Ziera',
    createdOn: '10-20-2025',
    lastUpdated: '10-20-2025',
    status: i % 2 === 0 ? 'Published' : 'In draft'
}))

export default function Workflows () {
    const [search, setSearch] = useState('')
    const [activeTab, setActiveTab] = useState('workflows')
    const [currentPage, setCurrentPage] = useState(1)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const itemsPerPage = 5

    const filtered = workflows.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase())
    )

    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    const paginatedWorkflows = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <DropdownProvider>
            <div className='flex-1 p-6 bg-gradient-to-br from-blue-500 via-blue-300 to-blue-100 min-h-screen overflow-x-hidden'>
                <TopNavbar />
                <div className='flex mt-4'>
                    <div className='flex-1'>
                        <div className='bg-white p-6 rounded-lg shadow-lg mr-2'>
                            <div className='flex justify-between items-center mb-6'>
                                <Breadcrumb
                                    text={
                                        <span className='font-bold'>
                                            Automations &gt; Workflows
                                        </span>
                                    }
                                />
                            </div>

                            <div className='flex justify-between items-center mb-4'>
                                <ReusableButton
                                    onClick={() => setIsModalOpen(true)}
                                    isActive={true}
                                >
                                    + Build New Workflow
                                </ReusableButton>
                                <div className='flex gap-2 items-center'>
                                    <div className='flex gap-2'>
                                        <ReusableButton
                                            onClick={() =>
                                                setActiveTab('workflows')
                                            }
                                            isActive={activeTab === 'workflows'}
                                        >
                                            Workflows
                                        </ReusableButton>
                                        <ReusableButton
                                            onClick={() =>
                                                setActiveTab('executed')
                                            }
                                            isActive={activeTab === 'executed'}
                                        >
                                            Executed Workflows
                                        </ReusableButton>
                                    </div>
                                    <SearchInput
                                        value={search}
                                        onChange={e =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder='Search'
                                    />
                                    <IconButton icon={Search} />
                                    <IconButton icon={Filter} />
                                </div>
                            </div>
                            <div className='overflow-visible relative z-[50]  horizontal-scroll-hidden'>
                                <WorkflowTable workflows={paginatedWorkflows} />
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                    <Sidebar className='mt-4' />
                </div>
                <Footer />

                {/* Modal Integration */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </DropdownProvider>
    )
}
