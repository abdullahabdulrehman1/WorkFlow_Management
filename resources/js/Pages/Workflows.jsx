import React, { useState, useEffect } from 'react'
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
import WorkflowLayout from '../components/layout/WorkflowLayout'

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
    const [isMobile, setIsMobile] = useState(false)
    const itemsPerPage = 5

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
            <WorkflowLayout breadcrumbText='Workflows'>
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
                        <IconButton icon={Search} />
                        <IconButton icon={Filter} />
                    </div>
                </div>
                <div className='overflow-visible relative z-[50] horizontal-scroll-hidden'>
                    <WorkflowTable workflows={paginatedWorkflows} />
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />

                {/* Modal Integration */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </WorkflowLayout>
        </DropdownProvider>
    )
}
