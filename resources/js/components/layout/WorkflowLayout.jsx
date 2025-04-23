import React from 'react'
import TopNavbar from './../navbar/index'
import { Breadcrumb } from '../reusable'
import Sidebar from '../sidebar/index'
import Footer from '../footer'

export default function WorkflowLayout ({ breadcrumbText, children }) {
    return (
        <div className='flex-1 p-6 bg-gradient-to-br from-blue-500 via-blue-300 to-blue-100 min-h-screen overflow-x-hidden'>
            <TopNavbar />
            <div className='flex mt-4'>
                <div className='flex-1'>
                    <div className='bg-white p-6 rounded-lg shadow-lg mr-2'>
                        <div className='flex justify-between items-center mb-6'>
                            <Breadcrumb
                                text={
                                    <span>
                                        Automation &gt; <strong>{breadcrumbText}</strong>
                                    </span>
                                }
                            />
                        </div>
                        {children}
                    </div>
                </div>
                <Sidebar className='mt-4' />
            </div>
            <Footer />
        </div>
    )
}
