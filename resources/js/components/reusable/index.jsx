import React from 'react';

export function Breadcrumb({ text }) {
    return (
        <div className="text-sm font-semibold text-gray-800">
            {text}
        </div>
    );
}

export function Button({ children, onClick, className }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1 rounded-full border font-semibold shadow transition-all ${className}`}
        >
            {children}
        </button>
    );
}

export function SearchInput({ value, onChange, placeholder }) {
    return (
        <input
            type="text"
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="px-4 py-2 rounded-full border border-yellow-400 bg-white text-sm shadow focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
    );
}

export function IconButton({ icon: Icon, onClick, className }) {
    return (
        <button
            onClick={onClick}
            className={`p-2 rounded-full border border-yellow-400 bg-yellow-100 hover:bg-yellow-200 shadow ${className}`}
        >
            <Icon className="w-4 h-4 text-yellow-600" />
        </button>
    );
}