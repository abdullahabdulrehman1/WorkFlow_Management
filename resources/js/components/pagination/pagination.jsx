import React from 'react'
import ReusableButton from '../button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const isMobile = useIsMobile();
    
    // Handle page navigation
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

    // Generate page numbers array for desktop view
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;
        
        if (totalPages <= maxPagesToShow) {
            // If we have fewer pages than our max, show them all
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always include first page
            pages.push(1);
            
            // Add ellipsis if needed
            if (currentPage > 3) {
                pages.push('...');
            }
            
            // Add pages around current page
            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);
            
            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }
            
            // Add ellipsis if needed
            if (currentPage < totalPages - 2) {
                pages.push('...');
            }
            
            // Always include last page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }
        
        return pages;
    };

    // Mobile-optimized pagination
    if (isMobile) {
        return (
            <div className='flex justify-between items-center gap-2 mt-4 px-1'>
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                        currentPage === 1 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className='flex items-center justify-center px-4 py-1.5 bg-white border border-blue-200 rounded-full shadow-sm'>
                    <span className='text-blue-800 font-medium text-sm'>{currentPage}</span>
                    <span className='mx-1 text-gray-400'>/</span>
                    <span className='text-gray-500 text-sm'>{totalPages}</span>
                </div>
                
                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
                        currentPage === totalPages 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        )
    }

    // Desktop pagination with page numbers
    return (
        <div className='flex justify-end items-center gap-2 mt-4'>
            <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                    currentPage === 1 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
            >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Previous</span>
            </button>
            
            <div className="flex items-center">
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <span className="px-2 text-gray-500">...</span>
                        ) : (
                            <button
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full mx-0.5 text-sm transition-colors ${
                                    currentPage === page
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-600 hover:bg-blue-100'
                                }`}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>
            
            <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                    currentPage === totalPages 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
            >
                <span className="text-sm">Next</span>
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    )
}

export default Pagination
