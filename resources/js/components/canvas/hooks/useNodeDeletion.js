import { useCallback } from 'react';

/**
 * Custom hook to manage node deletion logic
 * @param {Array} nodes - Current nodes array
 * @param {Function} setNodes - State setter for nodes
 * @param {Function} setEdges - State setter for edges
 * @returns {Function} Callback function to delete a node by ID
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