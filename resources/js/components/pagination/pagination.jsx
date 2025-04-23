import React from 'react'
import ReusableButton from '../button'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1)
        }
    }

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1)
        }
    }

    return (
        <div className='flex justify-end items-center gap-2 mt-4'>
            <ReusableButton
                onClick={handlePrevious}
                isActive={currentPage !== 1}
                className='px-2 py-1 text-sm'
                disabled={currentPage === 1}
            >
                Previous
            </ReusableButton>
            <span className='px-2 py-1 bg-white text-gray-800 rounded text-sm'>
                Page {currentPage} of {totalPages}
            </span>
            <ReusableButton
                onClick={handleNext}
                isActive={currentPage !== totalPages}
                className='px-2 py-1 text-sm'
                disabled={currentPage === totalPages}
            >
                Next
            </ReusableButton>
        </div>
    )
}

export default Pagination
