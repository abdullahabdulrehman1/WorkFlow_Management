/**
 * Creates a default trigger node with the specified name and ID
 */
export const createDefaultTriggerNode = (triggerName, triggerID) => ({
    id: '1',
    type: 'trigger',
    position: { x: 300, y: 50 },
    data: {
        label: triggerName || 'New Customer/Prospect (Manual)',
        trigger_id: triggerID
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
        // For trigger nodes, we need to set action_id to 1 (or appropriate value)
        // because the backend expects an action_id for ALL nodes
        if (node.type === 'trigger') {
            return {
                id: node.id,
                type: node.type,
                action_id: 1, // Default action ID for trigger nodes
                trigger_id: node.data?.trigger_id || triggerId,
                label: node.data?.label || 'Trigger',
                configuration_json: node.data?.configuration || {},
                x: Math.round(node.position.x),
                y: Math.round(node.position.y)
            }
        }

        // For action nodes
        return {
            id: node.id,
            type: node.type,
            action_id: node.data?.action_id || 1, // Default to 1 if not specified
            label: node.data?.label || 'Action',
            configuration_json: node.data?.configuration || {},
            x: Math.round(node.position.x),
            y: Math.round(node.position.y)
        }
    })

    // Convert edges to connections format
    const connections = edges.map(edge => ({
        source_node_id: edge.source,
        target_node_id: edge.target
    }))

    // Ensure we always return valid arrays for actions and connections
    return {
        nodes,
        edges,
        actions:
            actions.length > 0
                ? actions
                : [
                      // Default action if array is empty
                      {
                          id: '1',
                          type: 'trigger',
                          action_id: 1,
                          trigger_id: triggerId,
                          label: 'Default Trigger',
                          configuration_json: {},
                          x: 300,
                          y: 50
                      }
                  ],
        connections: connections.length > 0 ? connections : [],
        trigger_id: triggerId
    }
}

/**
 * Loads canvas data from API format to ReactFlow format
 */
export const loadCanvasData = (data, triggerName, triggerID) => {
    if (!data) return { nodes: [], edges: [] }

    try {
        // Extract workflow data from nested structure if needed
        const workflowData = data.workflow ? data.workflow : data

        console.log('Raw data from backend:', workflowData)

        // Create a map of all actions for easier access
        const actionMap = {}
        if (workflowData.actions && workflowData.actions.length > 0) {
            workflowData.actions.forEach(action => {
                actionMap[action.id] = action
            })
        }

        // First, collect all connection data so we can use it to ensure
        // we create all needed nodes
        const connectionMap = {}
        if (workflowData.connections && workflowData.connections.length > 0) {
            workflowData.connections.forEach(conn => {
                connectionMap[conn.source_node_id] = conn.source_node_id
                connectionMap[conn.target_node_id] = conn.target_node_id
            })
        }

        // Start building nodes, keeping a mapping from original ID to new node ID
        const nodeIdMapping = {}
        const loadedNodes = []

        // First, add trigger node
        const triggerNode = createDefaultTriggerNode(
            triggerName || workflowData.trigger?.name || 'Trigger',
            triggerID || workflowData.trigger_id
        )
        loadedNodes.push(triggerNode)
        nodeIdMapping['1'] = triggerNode.id

        // Process non-trigger actions into nodes
        if (workflowData.actions && workflowData.actions.length > 0) {
            console.log('Processing actions:', workflowData.actions)

            workflowData.actions.forEach(action => {
                // Skip trigger nodes as we already created one
                if (action.type === 'trigger') {
                    nodeIdMapping[String(action.id)] = triggerNode.id
                    return
                }

                // Create node data
                const nodeData = {
                    id: String(action.id), // Use the original ID from the database
                    type: action.type || 'action',
                    position: {
                        x: Number(action.x) || 300,
                        y: Number(action.y) || 100
                    },
                    data: {
                        label: action.label || action.action?.name || 'Action',
                        action_id: action.action_id,
                        configuration: action.configuration_json || {}
                    }
                }

                // Map the original ID to itself for consistent lookups
                nodeIdMapping[String(action.id)] = String(action.id)

                console.log(
                    `Created node from action ${nodeData.id}:`,
                    nodeData
                )
                loadedNodes.push(nodeData)
            })
        }

        // Check for any node IDs in connections that might not have been created yet
        // This ensures all nodes referenced in connections are created
        if (workflowData.connections && workflowData.connections.length > 0) {
            workflowData.connections.forEach(conn => {
                const sourceId = String(conn.source_node_id)
                const targetId = String(conn.target_node_id)

                // If we don't have mapping for either source or target,
                // and we have the action data, create nodes for them
                if (!nodeIdMapping[sourceId] && actionMap[sourceId]) {
                    const action = actionMap[sourceId]
                    const nodeData = {
                        id: String(action.id),
                        type: action.type || 'action',
                        position: {
                            x: Number(action.x) || 300,
                            y: Number(action.y) || 100
                        },
                        data: {
                            label:
                                action.label || action.action?.name || 'Action',
                            action_id: action.action_id,
                            configuration: action.configuration_json || {}
                        }
                    }
                    nodeIdMapping[sourceId] = sourceId
                    loadedNodes.push(nodeData)
                    console.log(
                        `Created additional node for source ${sourceId}:`,
                        nodeData
                    )
                }

                if (!nodeIdMapping[targetId] && actionMap[targetId]) {
                    const action = actionMap[targetId]
                    const nodeData = {
                        id: String(action.id),
                        type: action.type || 'action',
                        position: {
                            x: Number(action.x) || 350,
                            y: Number(action.y) || 150
                        },
                        data: {
                            label:
                                action.label || action.action?.name || 'Action',
                            action_id: action.action_id,
                            configuration: action.configuration_json || {}
                        }
                    }
                    nodeIdMapping[targetId] = targetId
                    loadedNodes.push(nodeData)
                    console.log(
                        `Created additional node for target ${targetId}:`,
                        nodeData
                    )
                }
            })
        }

        // Process connections into edges
        const loadedEdges = []
        if (workflowData.connections && workflowData.connections.length > 0) {
            console.log('Processing connections:', workflowData.connections)

            workflowData.connections.forEach(conn => {
                // Handle IDs consistently as strings
                const sourceId = String(conn.source_node_id)
                const targetId = String(conn.target_node_id)

                // For the new nodes that might not be in our current set
                // Create placeholder nodes using connection IDs directly
                if (!nodeIdMapping[sourceId] && !actionMap[sourceId]) {
                    console.log(
                        `Creating placeholder node for source ${sourceId}`
                    )
                    const nodeData = {
                        id: sourceId,
                        type: 'action',
                        position: { x: 200, y: 200 },
                        data: { label: `Node ${sourceId}`, action_id: 1 }
                    }
                    nodeIdMapping[sourceId] = sourceId
                    loadedNodes.push(nodeData)
                }

                if (!nodeIdMapping[targetId] && !actionMap[targetId]) {
                    console.log(
                        `Creating placeholder node for target ${targetId}`
                    )
                    const nodeData = {
                        id: targetId,
                        type: 'action',
                        position: { x: 400, y: 200 },
                        data: { label: `Node ${targetId}`, action_id: 1 }
                    }
                    nodeIdMapping[targetId] = targetId
                    loadedNodes.push(nodeData)
                }

                // Use the mapped node IDs to find the actual nodes
                const mappedSourceId = nodeIdMapping[sourceId] || sourceId
                const mappedTargetId = nodeIdMapping[targetId] || targetId

                console.log(
                    `Processing connection: ${sourceId}(mapped to ${mappedSourceId}) -> ${targetId}(mapped to ${mappedTargetId})`
                )

                // Find the actual nodes by their IDs
                const sourceNode = loadedNodes.find(
                    n => n.id === mappedSourceId
                )
                const targetNode = loadedNodes.find(
                    n => n.id === mappedTargetId
                )

                if (sourceNode && targetNode) {
                    const edgeId = `e${sourceNode.id}-${targetNode.id}`
                    loadedEdges.push({
                        id: edgeId,
                        source: sourceNode.id,
                        target: targetNode.id,
                        animated: true,
                        style: { stroke: '#f97316', strokeWidth: 2 },
                        type: 'default'
                    })
                    console.log(
                        `Created edge: ${edgeId} (${sourceNode.id} -> ${targetNode.id})`
                    )
                } else {
                    console.warn(
                        `Could not create edge: source=${sourceId}->target=${targetId}`
                    )
                    console.warn(
                        `Source node found: ${!!sourceNode}, Target node found: ${!!targetNode}`
                    )
                    console.warn(
                        'Available node IDs:',
                        loadedNodes.map(n => n.id)
                    )
                    console.warn('Node ID mapping:', nodeIdMapping)
                }
            })
        }

        console.log('Final nodes to render:', loadedNodes)
        console.log('Final edges to render:', loadedEdges)

        return {
            nodes: loadedNodes,
            edges: loadedEdges
        }
    } catch (error) {
        console.error('Error loading canvas data:', error)
        return {
            nodes: [createDefaultTriggerNode(triggerName, triggerID)],
            edges: []
        }
    }
}
