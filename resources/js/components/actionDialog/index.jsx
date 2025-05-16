import React, { useState } from 'react';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchBar, ActionItem } from './ReusableComponents';
import VisibilityToggleButton from './VisibilityToggleButton';
import SMSConfigurationForm from './SMSConfigurationForm';
import ActionList from './ActionList';
import useIsMobile from '../../hooks/useIsMobile';

const ActionDialog = ({ isOpen = true, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [showSMSConfig, setShowSMSConfig] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const isMobile = useIsMobile();
    
    // If on mobile, we'll show the actions inside the canvas
    // so we don't need to render the full ActionDialog
    if (isMobile) {
        return null;
    }

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    if (!isOpen) return null;

    const actions = [
        { label: 'Send Email', type: 'action', action_id: 1 },
        { label: 'Send SMS', type: 'action', action_id: 2 },
        { label: 'In-app notification', type: 'action', action_id: 3 },
 
    ];

    // Filter actions based on search query
    const filteredActions = actions.filter(action =>
        action.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (    
        <div className='relative shadow-xl'>
            <VisibilityToggleButton
                isVisible={isVisible}
                toggleVisibility={toggleVisibility}
            />
            {!isVisible && (
                <div className='absolute top-4 right-4 border border-blue-500 w-[280px] bg-white shadow-lg rounded-4xl p-4 flex flex-col gap-4'>
                    <button
                        className='flex items-center justify-center mt-2 gap-2 p-1 bg-blue-300 border border-blue-500 rounded-full text-white text-xs hover:bg-blue-400'
                        onClick={() => {
                            setShowSMSConfig(!showSMSConfig);
                            setIsVisible(false);
                        }}
                    >
                        SMS Configuration
                        <div className='flex items-center justify-center w-4 h-4 bg-white rounded-full'>
                            {showSMSConfig ? (
                                <ChevronDown className='text-blue-500' />
                            ) : (
                                <ChevronUp className='text-blue-500' />
                            )}
                        </div>
                    </button>
                    {showSMSConfig ? (
                        <SMSConfigurationForm />
                    ) : (
                        <>
                            <h2 className='text-sm font-bold text-gray-700'>
                                Actions
                            </h2>
                            <SearchBar
                                placeholder='Search actions'
                                onSearch={handleSearch}
                            />
                            <ActionList actions={filteredActions} />
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// Export actions list to be used by both desktop and mobile components
export const getWorkflowActions = () => [
    { label: 'Send Email', type: 'action', action_id: 1 },
    { label: 'Send SMS', type: 'action', action_id: 2 },
    { label: 'In-app notification', type: 'action', action_id: 3 },
];

export default ActionDialog;
