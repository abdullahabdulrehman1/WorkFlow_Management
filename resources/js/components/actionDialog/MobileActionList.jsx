import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { ActionItem } from './ReusableComponents';

/**
 * Mobile-optimized action toolbar that displays inside the canvas
 */
const MobileActionList = ({ actions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to handle direct tap-to-add action
  const handleActionTap = (action) => {
    // Use a global variable for reliability on mobile
    window.mobileWorkflowAction = {
      action: {
        label: action.label,
        type: action.type,
        action_id: action.action_id
      },
      timestamp: Date.now()
    };
    
    console.log('Action tapped:', action.label);
    setIsExpanded(false);
  };

  return (
    <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-[95%] w-full">
        {/* Header/toggle bar */}
        <div 
          className="flex justify-between items-center px-3 py-2 border-b cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-sm font-medium text-gray-700">Actions</span>
          <button className="text-gray-500 hover:text-gray-700">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        {/* Action items */}
        {isExpanded && (
          <div className="p-2 max-h-[150px] overflow-y-auto">
            {actions.map((action, i) => (
              <div key={i} className="mb-2 relative">
                <button 
                  onClick={() => handleActionTap(action)} 
                  className="w-full relative"
                >
                  <div className="absolute top-2 right-2 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                    <Plus className="text-white" size={14} />
                  </div>
                  <ActionItem
                    key={i}
                    action={action}
                    compact={true}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileActionList;