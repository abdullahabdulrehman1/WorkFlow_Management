import React from 'react';

export default function SaveIndicator({ saved }) {
    return (
        <div className={`transition-opacity duration-500 ${saved ? 'opacity-100' : 'opacity-0'}`}>
            <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                Saved
            </span>
        </div>
    );
}