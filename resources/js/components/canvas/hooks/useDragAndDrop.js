import { useState, useCallback } from 'react';

/**
 * Custom hook to handle drag and drop functionality for canvas elements
 * @param {Function} screenToFlowPosition - Function to convert screen coordinates to flow position
 * @param {Function} setNodes - State setter for nodes
 * @param {Function} deleteNode - Function to delete a node
 * @returns {Object} Drag and drop event handlers and state
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