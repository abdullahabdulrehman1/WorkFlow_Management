import React from 'react'

const ReusableButton = ({ onClick, children, className, isActive }) => {
    const activeClass = isActive
        ? 'border-yellow-400 bg-yellow-100 text-black'
        : 'border-gray-300 bg-white text-gray-500'

    return (
        <button
            onClick={onClick}
            className={`${activeClass} ${className} text-sm cursor-pointer font-semibold px-4 py-2 rounded-full flex items-center shadow`}
        >
            {children}
        </button>
    )
}

export default ReusableButton
