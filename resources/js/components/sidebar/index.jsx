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
import { motion } from 'framer-motion'

const Sidebar = () => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed)
    }

    // Button animation variants - removed backgroundColor to let Tailwind handle it
    const buttonVariants = {
        hover: {
            scale: 1.1,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        },
        tap: { scale: 0.95 }
    }

    // Staggered animation for buttons
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07,
                delayChildren: 0.1
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className='relative '>
            {isCollapsed ? (
                <motion.button
                    onClick={toggleSidebar}
                    className='absolute top-2 left-1 p-2 bg-white rounded-full shadow hover:bg-gray-100 z-50'
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {' '}
                    <ChevronRight
                        className={`text-blue-500 transition-transform duration-300 rotate-180`}
                    />
                </motion.button>
            ) : (
                <div
                    className={`flex flex-col items-center bg-gradient-to-br from-white/30 via-gray-100/30 to-gray-200/30 backdrop-blur-md shadow-xl rounded-full p-2 transition-all duration-300 w-12 border border-blue-300/50`}
                >
                    <motion.button
                        onClick={toggleSidebar}
                        className='mb-4 p-1.5 bg-white rounded-full shadow hover:bg-gray-100'
                        whileHover={buttonVariants.hover}
                        whileTap={buttonVariants.tap}
                    >
                        <ChevronRight className='text-blue-500 w-4 h-4' />
                    </motion.button>
                    <motion.div
                        className='flex flex-col items-center gap-3'
                        variants={containerVariants}
                        initial='hidden'
                        animate='show'
                    >
                        <motion.button
                            className='p-1.5 rounded-full hover:bg-white'
                            variants={itemVariants}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            <Search className='text-blue-500 w-4 h-4' />
                        </motion.button>
                        <motion.button
                            className='p-1.5 rounded-full hover:bg-white'
                            variants={itemVariants}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            <Phone className='text-blue-500 w-4 h-4' />
                        </motion.button>
                        <motion.button
                            className='p-1.5 rounded-full hover:bg-white'
                            variants={itemVariants}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            <Mail className='text-blue-500 w-4 h-4' />
                        </motion.button>
                        <motion.button
                            className='p-1.5 rounded-full hover:bg-white'
                            variants={itemVariants}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            <MessageCircle className='text-blue-500 w-4 h-4' />
                        </motion.button>
                        <motion.button
                            className='p-1.5 rounded-full hover:bg-white'
                            variants={itemVariants}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            <Calendar className='text-blue-500 w-4 h-4' />
                        </motion.button>
                        <motion.button
                            className='p-1.5 rounded-full hover:bg-white'
                            variants={itemVariants}
                            whileHover={buttonVariants.hover}
                            whileTap={buttonVariants.tap}
                        >
                            <Shield className='text-blue-500 w-4 h-4' />
                        </motion.button>

                        {/* System buttons with margin/padding for separation */}
                        <motion.div
                            className='mt-4 pt-4 border-t border-gray-200/50 w-full flex flex-col items-center gap-3'
                            variants={containerVariants}
                        >
                            <motion.button
                                className='p-1.5 rounded-full hover:bg-white'
                                variants={itemVariants}
                                whileHover={buttonVariants.hover}
                                whileTap={buttonVariants.tap}
                            >
                                <LogOut className='text-blue-500 w-4 h-4' />
                            </motion.button>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </div>
    )
}

export default Sidebar
