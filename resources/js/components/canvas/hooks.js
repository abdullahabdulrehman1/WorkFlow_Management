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
        const data = JSON.parse(
          event.dataTransfer.getData('application/reactflow')
        );
        
        // Generate a consistently formatted ID (use timestamp for uniqueness)
        const newId = String(Date.now());
        console.log(`Creating new node with ID: ${newId}`);

        const newNode = {
          id: newId,
          type: data.type,
          position,
          data: {
            label: data.label,
            action_id: 1, // Set a default action_id for the node
            onDelete: () => deleteNode(newId)
          },
          draggable: true
        };

        setNodes(nds => nds.concat(newNode));
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
 */
export const useCanvasInitialization = (
  triggerName, 
  triggerID, 
  setNodes, 
  setEdges
) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // On first load, set up with default trigger node
      const defaultTrigger = createDefaultTriggerNode(triggerName, triggerID);
      setNodes([defaultTrigger]);
      setEdges([]);
      setIsInitialized(true);
    } else if (triggerName) {
      // Update the trigger node label when trigger name changes
      setNodes(nds =>
        nds.map(node => {
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
        })
      );
    }
  }, [triggerName, triggerID, isInitialized, setNodes, setEdges]);

  return {
    isInitialized,
    setIsInitialized
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
  const [error, setError] = useState(null);
  const saveTimeoutRef = useRef(null);
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
      
      console.log(`Canvas saved at ${now.toLocaleTimeString()}`);
      toast.success('Workflow canvas saved');
    } catch (err) {
      console.error('Error saving canvas:', err);
      setError('Failed to save canvas');
      toast.error('Failed to save workflow canvas');
    }
  }, [workflowId, canvasRef]);

  // Function to load canvas data from backend
  const loadCanvas = useCallback(async () => {
    if (!workflowId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/workflows/${workflowId}/canvas`);
      
      if (isMounted.current && canvasRef.current) {
        canvasRef.current.loadCanvas(response.data);
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
    error,
    manualSave,
    reloadCanvas: loadCanvas
  };
};