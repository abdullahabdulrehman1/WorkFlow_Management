import React from 'react';
import { Save, CheckCircle } from 'lucide-react';

/**
 * A minimal save status indicator component that shows when content has been saved
 * @param {Object} props
 * @param {boolean} props.saved - Whether the content has been saved
 */
const SaveIndicator = ({ saved = false }) => {
  return (
    <div className="flex items-center ml-2">
      {saved ? (
        <div className="flex items-center text-green-500">
          <CheckCircle size={16} />
          <span className="text-xs ml-1">Saved</span>
        </div>
      ) : (
        <Save size={16} className="text-gray-400" />
      )}
    </div>
  );
};

export default SaveIndicator;