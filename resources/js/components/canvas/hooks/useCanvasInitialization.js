import { useState, useEffect, useRef } from 'react';
import { createDefaultTriggerNode } from '../utils';

/**
 * Custom hook to initialize and update canvas with trigger node
 * Only creates default trigger if no saved data exists
 * 
 * @param {string} triggerName - Name of the trigger
 * @param {number} triggerID - ID of the trigger
 * @param {Function} setNodes - State setter for nodes
 * @param {Function} setEdges - State setter for edges
 * @returns {Object} Initialization state and control functions
 */
export const useCanvasInitialization = (
  triggerName, 
  triggerID, 
  setNodes, 
  setEdges
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const hasLoadedData = useRef(false);

  useEffect(() => {
    if (!isInitialized && !hasLoadedData.current) {
      // Only create default trigger if no data has been loaded yet
      const defaultTrigger = createDefaultTriggerNode(triggerName, triggerID);
      setNodes([defaultTrigger]);
      setEdges([]);
      setIsInitialized(true);
      console.log('Created initial default trigger - no saved data loaded yet');
    } else if (triggerName && isInitialized) {
      // Update the trigger node label when trigger name changes
      setNodes(nds => {
        const triggerNode = nds.find(node => node.type === 'trigger');
        if (triggerNode) {
          console.log(`Updating existing trigger node label to: ${triggerName}`);
          return nds.map(node => {
            if (node.type === 'trigger') {
              return {
                ...node,
                data: {
                  ...node.data,
                  label: triggerName,
                  trigger_id: triggerID
                }
              };
            }
            return node;
          });
        }
        return nds;
      });
    }
  }, [triggerName, triggerID, isInitialized, setNodes, setEdges]);

  // Function to mark that data has been loaded from server
  const setDataLoaded = () => {
    hasLoadedData.current = true;
    console.log('Canvas data loaded from server - will not use default trigger');
  };

  return {
    isInitialized,
    setIsInitialized,
    setDataLoaded
  };
};