/**
 * Creates a default trigger node with the specified name and ID
 */
export const createDefaultTriggerNode = (triggerName, triggerID) => ({
    id: '1', // Use a simple numeric ID format for better compatibility
    type: 'trigger',
    position: { x: 300, y: 50 },
    data: {
        label: triggerName || 'New Customer/Prospect (Manual)',
        trigger_id: triggerID || 1,
        configuration: {}
    }
})

/**
 * Converts ReactFlow nodes and edges to the API format
 */
export const convertCanvasDataForAPI = (nodes, edges) => {
    // Get trigger data from the first node (usually node with id '1')
    const triggerNode = nodes.find(node => node.type === 'trigger')
    const triggerId = triggerNode?.data?.trigger_id || 1

    // Convert nodes to actions format
    const actions = nodes.map(node => {
        // Parse the ID to ensure it's an integer for the backend
        const nodeId = parseInt(node.id.toString().replace(/\D/g, '')) || 1

        // For trigger nodes, set type explicitly to 'trigger' and don't include action_id
        if (node.type === 'trigger') {
            return {
                id: nodeId, // Ensure integer ID
                type: 'trigger', // Explicitly set the type
                trigger_id: node.data?.trigger_id || triggerId,
                label: node.data?.label || 'Trigger',
                configuration_json: node.data?.configuration || {},
                x: Math.round(node.position.x),
                y: Math.round(node.position.y)
            }
        }

        // For action nodes - require action_id
        return {
            id: nodeId, // Ensure integer ID
            type: 'action',
            action_id: node.data?.action_id, // Required for action nodes
            label: node.data?.label || 'Action',
            configuration_json: node.data?.configuration || {},
            x: Math.round(node.position.x),
            y: Math.round(node.position.y)
        }
    })

    // Convert edges to connections format
    const connections = edges.map(edge => {
        // For connections, the backend expects string IDs, not integers
        // So we keep the source and target as strings
        return {
            source_node_id: edge.source.toString(),
            target_node_id: edge.target.toString()
        }
    })

    // Ensure we always return valid arrays for actions and connections
    return {
        nodes,
        edges,
        actions: actions, // Simply return the actual actions without fallback
        connections: connections.length > 0 ? connections : [],
        trigger_id: triggerId
    }
}

/**
 * Process and normalize data received from the backend to ensure consistent React Flow format
 * @param {Object} apiData - The raw data from the backend API
 * @param {string} triggerName - The name for the trigger node
 * @param {number} triggerID - The ID for the trigger node
 * @param {function} deleteNodeCallback - Function to delete a node
 * @returns {Object} - Properly formatted nodes and edges for React Flow
 */
export const processApiData = (
    apiData,
    triggerName,
    triggerID,
    deleteNodeCallback
) => {
    const workflowData = apiData?.workflow || apiData || {}
    const actions = workflowData.actions || []
    const connections = workflowData.connections || []

    const processedNodeIds = new Set()
    const processedNodes = []

    console.log('Processing API data:', workflowData)

    // First, explicitly look for nodes with type === 'trigger'
    // This is the most reliable way to identify trigger nodes
    let triggerAction = actions.find(action => action.type === 'trigger')

    // Found a trigger node
    if (triggerAction) {
        console.log('Found trigger node in API data by type:', triggerAction)
        const triggerNodeId = String(triggerAction.id)
        processedNodes.push({
            id: triggerNodeId,
            type: 'trigger',
            position: {
                x: Number(triggerAction.x) || 300,
                y: Number(triggerAction.y) || 50
            },
            data: {
                label: triggerAction.label ?? triggerName ?? 'Trigger',
                trigger_id: triggerAction.trigger_id ?? triggerID ?? 1,
                configuration: triggerAction.configuration_json ?? {}
            }
        })
        processedNodeIds.add(triggerNodeId)
    } else {
        // No trigger node found, create a default one
        console.log('No trigger node found in API data, creating default')
        const defaultTrigger = createDefaultTriggerNode(triggerName, triggerID)
        processedNodes.push(defaultTrigger)
        processedNodeIds.add(defaultTrigger.id)
    }

    // Now add action nodes - explicitly check the 'type' field to ensure we don't include trigger nodes
    actions
        .filter(action => {
            // Only include nodes explicitly marked as 'action' or without a type (legacy nodes)
            // and exclude any node we've already processed as a trigger
            return (
                action.type !== 'trigger' && // Not a trigger node
                action.id && // Has valid ID
                action.action_id && // Has valid action_id
                !processedNodeIds.has(String(action.id)) // Not already processed
            )
        })
        .forEach(action => {
            const nodeId = String(action.id)

            processedNodes.push({
                id: nodeId,
                type: 'action',
                position: {
                    x: Number(action.x) || 300,
                    y: Number(action.y) || 150
                },
                data: {
                    label:
                        action.label ?? action.action?.name ?? 'Unnamed Action',
                    action_id: Number(action.action_id),
                    configuration: action.configuration_json ?? {},
                    onDelete: deleteNodeCallback
                        ? () => deleteNodeCallback(nodeId)
                        : undefined
                }
            })

            processedNodeIds.add(nodeId)
        })

    // Add edges only if both nodes exist
    const processedEdges = connections
        .map(conn => {
            const sourceId = String(conn.source_node_id)
            const targetId = String(conn.target_node_id)

            if (
                processedNodeIds.has(sourceId) &&
                processedNodeIds.has(targetId)
            ) {
                return {
                    id: `e-${sourceId}-${targetId}`,
                    source: sourceId,
                    target: targetId,
                    animated: true,
                    style: { stroke: '#f97316', strokeWidth: 2 }
                }
            }

            return null
        })
        .filter(Boolean) // remove invalid ones

    return { nodes: processedNodes, edges: processedEdges }
}
