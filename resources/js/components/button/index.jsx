import React from 'react'
import useIsMobile from '../../hooks/useIsMobile'

const ReusableButton = ({ onClick, children, className, isActive }) => {
    const isMobile = useIsMobile();
    
    const activeClass = isActive
        ? 'border-yellow-400 bg-yellow-100 text-black'
        : 'border-gray-300 bg-white text-gray-500'
    
    const mobileClass = isMobile ? 'w-full justify-center' : '';

    return (
        <button
            onClick={onClick}
            className={`${activeClass} ${mobileClass} ${className} text-sm cursor-pointer font-semibold px-4 py-2 rounded-full flex items-center shadow`}
        >
            {children}
        </button>
    )
}

export default ReusableButton
