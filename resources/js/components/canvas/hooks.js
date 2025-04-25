import { useCallback, useState, useEffect, useRef } from 'react';
import { createDefaultTriggerNode } from './utils';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/**
 * Custom hook to manage node deletion logic
 */
export const useNodeDeletion = (nodes, setNodes, setEdges) => {
  return useCallback(
    id => {
      // Don't allow deletion of trigger nodes
      const nodeToDelete = nodes.find(node => node.id === id);
      if (nodeToDelete && nodeToDelete.type === 'trigger') return;

      setNodes(nds => nds.filter(node => node.id !== id));
      setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
    },
    [nodes, setNodes, setEdges]
  );
};

/**
 * Custom hook to handle drag and drop functionality
 */
export const useDragAndDrop = (screenToFlowPosition, setNodes, deleteNode) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const onDragOver = useCallback(event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDraggingOver(false);
  }, []);

  const onDrop = useCallback(
    event => {
      event.preventDefault();
      setIsDraggingOver(false);

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });

      try {
        // Get and log the data transfer content for debugging
        const dataTransferText = event.dataTransfer.getData('application/reactflow');
        console.log('Dropped data:', dataTransferText);
        
        const data = JSON.parse(dataTransferText);
        
        // Generate a stable numeric ID that won't conflict with existing nodes
        // Starting from 100 to avoid conflicts with trigger node (ID: 1)
        const timestamp = Date.now();
        const numericId = String(timestamp % 1000000000 + 100);
        
        // Ensure we have a valid label from the data or provide a meaningful default
        const nodeLabel = data.label || 'Action Node';
        console.log(`Creating new node with label: "${nodeLabel}" and ID: ${numericId}`);
        
        // Build a consistent node structure with all required properties
        const newNode = {
          id: numericId,
          type: data.type || 'action',
          position,
          data: {
            label: nodeLabel,
            // Only use the explicitly provided action_id, don't default to 1
            action_id: data.action_id,
            configuration: data.configuration || {},
            onDelete: () => deleteNode(numericId),
            // Store the original creation timestamp to ensure stability
            _created: timestamp
          },
          draggable: true
        };

        // Add the new node to the canvas
        setNodes(nds => {
          // Check for duplicates (unlikely but possible with very fast clicking)
          if (nds.some(n => n.id === numericId)) {
            console.warn(`Prevented duplicate node creation with ID: ${numericId}`);
            return nds;
          }
          return nds.concat(newNode);
        });
      } catch (error) {
        console.error('Error adding new node:', error);
      }
    },
    [screenToFlowPosition, setNodes, deleteNode]
  );

  return {
    isDraggingOver,
    onDragOver,
    onDragLeave,
    onDrop
  };
};

/**
 * Custom hook to initialize and update canvas with trigger node
 * Only creates default trigger if no saved data exists
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

/**
 * Custom hook to auto-save and auto-load canvas data
 * @param {number} workflowId - The ID of the workflow
 * @param {Object} canvasRef - Ref to the canvas component with getCanvasData method
 * @param {number} saveInterval - Interval in ms to save canvas (default: 10000ms/10s)
 */
export const useAutoSaveCanvas = (workflowId, canvasRef, saveInterval = 10000) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
  const justSavedTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Function to save canvas data to backend
  const saveCanvas = useCallback(async () => {
    if (!workflowId || !canvasRef.current) return;
    
    try {
      const canvasData = canvasRef.current.getCanvasData();
      await axios.post(`/api/workflows/${workflowId}/canvas`, canvasData);
      
      const now = new Date();
      setLastSaved(now);
      setError(null);
      
      // Set justSaved flag to true and clear after 2 seconds
      setJustSaved(true);
      if (justSavedTimeoutRef.current) {
        clearTimeout(justSavedTimeoutRef.current);
      }
      justSavedTimeoutRef.current = setTimeout(() => {
        setJustSaved(false);
      }, 2000);
      
      console.log(`Canvas saved at ${now.toLocaleTimeString()}`);
      // No longer show toast notification - the SaveClock will handle this
      // toast.success('Workflow canvas saved');
    } catch (err) {
      console.error('Error saving canvas:', err);
      setError('Failed to save canvas');
      toast.error('Failed to save workflow canvas');
    }
  }, [workflowId, canvasRef]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (justSavedTimeoutRef.current) {
        clearTimeout(justSavedTimeoutRef.current);
      }
    };
  }, []);

  // Function to load canvas data from backend
  const loadCanvas = useCallback(async () => {
    if (!workflowId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/workflows/${workflowId}/canvas`);
      
      if (isMounted.current && canvasRef.current) {
        // Before loading, store the current ID state so we can properly restore nodes
        const originalResponse = response.data;
        
        console.log('Loading workflow canvas data:', originalResponse);
        
        // Load canvas with data
        canvasRef.current.loadCanvas(originalResponse);
        console.log('Canvas loaded successfully');
      }
    } catch (err) {
      console.error('Error loading canvas:', err);
      setError('Failed to load canvas');
      toast.error('Failed to load workflow canvas');
    } finally {
      setIsLoading(false);
    }
  }, [workflowId, canvasRef]);

  // Load canvas data when component mounts
  useEffect(() => {
    loadCanvas();
    
    return () => {
      isMounted.current = false;
    };
  }, [loadCanvas]);

  // Set up auto-save interval
  useEffect(() => {
    if (!workflowId) return;

    // Start auto-save interval
    const startAutoSave = () => {
      saveTimeoutRef.current = setTimeout(() => {
        saveCanvas();
        startAutoSave(); // Schedule next save
      }, saveInterval);
    };
    
    // Start the first auto-save timer
    startAutoSave();
    
    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [workflowId, saveCanvas, saveInterval]);

  // Manual save function for immediate saving
  const manualSave = useCallback(() => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save immediately
    saveCanvas();
    
    // Restart auto-save timer
    saveTimeoutRef.current = setTimeout(() => {
      saveCanvas();
    }, saveInterval);
  }, [saveCanvas, saveInterval]);

  return {
    isLoading,
    lastSaved,
    justSaved,
    error,
    manualSave,
    reloadCanvas: loadCanvas
  };
};