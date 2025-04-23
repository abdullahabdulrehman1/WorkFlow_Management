import React, { useState } from 'react'
import {
    Search,
    Phone,
    Mail,
    MessageCircle,
    Calendar,
    Shield,
    LogOut,
    ChevronRight,
    ChevronLeft
} from 'lucide-react'

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed)
    }

    return (
        <div className='relative '>
            {isCollapsed ? (
                <button
                    onClick={toggleSidebar}
                    className='absolute top-2 left-1 p-2 bg-white rounded-full shadow hover:bg-gray-100 z-50'
                >
                    {' '}
                    <ChevronRight
                        className={`text-blue-500 transition-transform duration-300 rotate-180`}
                    />
                </button>
            ) : (
                <div
                    className={`flex flex-col items-center bg-gradient-to-br from-white/30 via-gray-100/30 to-gray-200/30 backdrop-blur-md shadow-xl rounded-full p-2 transition-all duration-300 w-16 border border-blue-300/50`}
                >
                    <button
                        onClick={toggleSidebar}
                        className='mb-4 p-2 bg-white rounded-full shadow hover:bg-gray-100'
                    >
                        <ChevronRight className='text-blue-500' />
                    </button>
                    <div className='flex flex-col items-center gap-4'>
                        <button className='p-2 rounded-full  hover:bg-white hover:p-2'>
                            <Search className='text-blue-500' />
                        </button>
                        <button className='p-2 rounded-full  hover:bg-white hover:p-2'>
                            <Phone className='text-blue-500' />
                        </button>
                        <button className='p-2 rounded-full  hover:bg-white hover:p-2'>
                            <Mail className='text-blue-500' />
                        </button>
                        <button className='p-2 rounded-full  hover:bg-white hover:p-2'>
                            <MessageCircle className='text-blue-500' />
                        </button>
                        <button className='p-2 rounded-full  hover:bg-white hover:p-2'>
                            <Calendar className='text-blue-500' />
                        </button>
                        <button className='p-2 rounded-full  hover:bg-white hover:p-2'>
                            <Shield className='text-blue-500' />
                        </button>
                        <button className='p-2 rounded-full  hover:bg-white hover:p-2'>
                            <LogOut className='text-blue-500' />
                        </button>   
                    </div>
                </div>
            )}
        </div>
    )
}

export default Sidebar
