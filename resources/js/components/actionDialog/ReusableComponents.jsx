import React, { useState } from 'react'

const SearchBar = ({ placeholder, onSearch }) => {
    const [searchText, setSearchText] = useState('')

    const handleChange = e => {
        const value = e.target.value
        setSearchText(value)
        onSearch(value) 
    }

    return (
        <div className='flex items-center rounded-full px-3 py-1 border border-yellow-400 bg-blue-100'>
            <input
                type='text'
                placeholder={placeholder}
                value={searchText}
                onChange={handleChange}
                className='bg-transparent text-sm flex-1 outline-none'
            />
            <button
                className='ml-2 text-sky-600'
                onClick={() => onSearch(searchText)}
            >
                🔍
            </button>
        </div>
    )
}

const ActionItem = ({ action, onDragStart, compact = false }) => (
    <div
        className={`${compact 
            ? 'p-2 rounded-md' 
            : 'p-3 rounded-lg'} shadow-sm border bg-yellow-50 text-xs text-gray-700 hover:bg-yellow-100 cursor-pointer`}
        draggable
        onDragStart={onDragStart}
    >
        <strong>{action.label}</strong>
        {!compact && (
            <div className='text-[10px] text-gray-500'>
                Description about {action.label.toLowerCase()}
            </div>
        )}
    </div>
)

export { SearchBar, ActionItem }
