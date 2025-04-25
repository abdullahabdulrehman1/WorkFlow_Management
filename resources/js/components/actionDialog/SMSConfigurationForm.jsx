import React from 'react';

const SMSConfigurationForm = () => {
    return (
        <div className='mt-0'>
            <label className='block text-sm font-bold text-gray-700'>
                To
            </label>
            <input
                type='text'
                placeholder='To phone number'
                className='w-full p-1 mt-1 border border-blue-300 rounded-4xl focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <label className='block mt-4 text-sm font-bold text-gray-700'>
                From
            </label>
            <input
                type='text'
                placeholder='From phone number'
                className='w-full p-1 mt-1 border border-blue-300 rounded-4xl focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
            <label className='block mt-4 text-sm font-bold text-gray-700'>
                SMS content
            </label>
            <textarea
                placeholder='Content of the SMS'
                className='w-full p-1 mt-1 border border-blue-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500'
            ></textarea>
            <div className='flex justify-end mt-4 gap-2'>
                <button className='border px-1 py-1 cursor-pointer rounded-full text-sm font-medium'>
                    Cancel
                </button>
                <button className='bg-yellow-400 cursor-pointer text-black px-1 py-1 rounded-full text-sm font-semibold shadow'>
                    Save workflow
                </button>
            </div>
        </div>
    );
};

export default SMSConfigurationForm;