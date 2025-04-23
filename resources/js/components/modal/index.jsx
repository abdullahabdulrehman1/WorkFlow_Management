import React from 'react';

const Modal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-1/3">
                {/* Modal Header */}
                <div className="bg-sky-500 text-white text-center py-3 rounded-t-lg">
                    <h2 className="text-lg font-semibold">Create Workflow</h2>
                </div>

                {/* Modal Body */}
                <div className="p-6">
                    <div className="mb-4">
                        <label
                            htmlFor="workflowName"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Workflow name
                        </label>
                        <input
                            type="text"
                            id="workflowName"
                            placeholder="Type workflow name"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div className="mb-6">  
                        <label
                            htmlFor="trigger"
                            className="block text-gray-700 font-medium mb-2"
                        >
                            Trigger
                        </label>
                        <select
                            id="trigger"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                            <option value="">Select a trigger</option>
                            <option value="trigger1">Trigger 1</option>
                            <option value="trigger2">Trigger 2</option>
                        </select>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-between items-center px-6 py-4 bg-gray-100 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-200"
                    >
                        Cancel
                    </button>
                    <button className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                        Create workflow
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;