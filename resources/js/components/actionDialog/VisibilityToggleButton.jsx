import React from 'react'
import { ChevronRight } from 'lucide-react'

const VisibilityToggleButton = ({ isVisible, toggleVisibility }) => {
    return (
        <button
            onClick={toggleVisibility}
            className='absolute top-2 right-1 p-2 bg-white rounded-full shadow hover:bg-gray-100 z-50'
        >
            <ChevronRight
                className={`text-blue-500 ${isVisible ? 'rotate-180' : ''}`}
            />
        </button>
    )
}

export default VisibilityToggleButton
