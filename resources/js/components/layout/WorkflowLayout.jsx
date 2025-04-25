import React from 'react'
import TopNavbar from './../navbar/index'
import { Breadcrumb } from '../reusable'
import Sidebar from '../sidebar/index'
import Footer from '../footer'
import { motion } from 'framer-motion'
import { Link } from '@inertiajs/react'

export default function WorkflowLayout ({ breadcrumbText, children }) {
    // Animation variants
    const contentVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.5,
                ease: "easeOut"
            }
        }
    }

    const breadcrumbVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: {
                delay: 0.2,
                duration: 0.4
            }
        }
    }

    return (
        <div className='flex-1 p-6 bg-gradient-to-br from-blue-500 via-blue-300 to-blue-100 min-h-screen overflow-x-hidden'>
            <TopNavbar />
            <div className='flex mt-4'>
                <div className='flex-1'>
                    <motion.div 
                        className='bg-white p-6 rounded-lg shadow-lg mr-2'
                        initial="hidden"
                        animate="visible"
                        variants={contentVariants}
                    >
                        <motion.div 
                            className='flex justify-between items-center mb-6'
                            variants={breadcrumbVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <Breadcrumb
                                text={
                                    <span>
                                        <Link href="/workflows" className="text-blue-500 hover:text-blue-700 hover:underline">Automation</Link> &gt; <strong>{breadcrumbText}</strong>
                                    </span>
                                }
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            {children}
                        </motion.div>
                    </motion.div>
                </div>
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6, type: "spring", stiffness: 100 }}
                >
                    <Sidebar className='mt-4' />
                </motion.div>
            </div>
            <Footer />
        </div>
    )
}
