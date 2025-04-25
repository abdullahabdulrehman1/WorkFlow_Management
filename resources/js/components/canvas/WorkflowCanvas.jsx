import { useCallback, useImperativeHandle, forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

// Import node types
import { nodeTypes } from './nodes'

// Import utils
import {
    createDefaultTriggerNode,
    convertCanvasDataForAPI,
    processApiData
} from './utils'

// Import custom hooks
import {
    useNodeDeletion,
    useDragAndDrop,
    useCanvasInitialization
} from './hooks'

// Import UI components
import {
    FlowBackground,
    FlowControls,
    FlowMiniMap,
    DropIndicator,
    WorkflowNameDisplay
} from './FlowComponents'

/**
 * WorkflowCanvas - A React Flow based canvas for designing workflows with nodes and connections
 * This component handles the core canvas functionality including:
 * - Node creation, deletion and connections
 * - Drag and drop interaction
 * - Loading and saving workflow data
 */
const WorkflowCanvas = forwardRef((props, ref) => {
    const { workflowName, triggerName, triggerID } = props

    // Initialize states for nodes and edges
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    // Get the React Flow utility for coordinate conversion
    const { screenToFlowPosition } = useReactFlow()

    // Custom hook for node deletion
    const deleteNode = useNodeDeletion(nodes, setNodes, setEdges)

    // Initialize canvas with trigger node
    const { isInitialized, setIsInitialized, setDataLoaded } =
        useCanvasInitialization(triggerName, triggerID, setNodes, setEdges)

    // Custom hook for drag and drop functionality
    const { isDraggingOver, onDragOver, onDragLeave, onDrop } = useDragAndDrop(
        screenToFlowPosition,
        setNodes,
        deleteNode
    )

    // Handle connecting nodes
    const onConnect = useCallback(
        params => {
            // Log connection attempt for debugging
            console.log('Connection attempt:', params)

            // Ensure we're not trying to create a self-loop
            if (params.source === params.target) {
                console.warn('Prevented self-loop connection')
                return
            }

            // Add the new edge
            setEdges(eds => {
                // Create a unique edge ID for this connection
                const edgeId = `e${params.source}-${params.target}`

                // Check if this edge already exists
                if (eds.some(e => e.id === edgeId)) {
                    console.log(
                        'This connection already exists, not adding duplicate'
                    )
                    return eds
                }

                // Add the new edge to the edges array
                const newEdge = {
                    ...params,
                    id: edgeId,
                    animated: true,
                    style: { stroke: '#f97316', strokeWidth: 2 },
                    type: 'default'
                }
                console.log('Added new edge:', newEdge)
                return addEdge(params, eds)
            })
        },
        [setEdges]
    )

    // Expose methods to parent components through ref
    useImperativeHandle(ref, () => ({
        // Clear canvas - reset to only the trigger node
        clearCanvas: () => {
            const defaultTrigger = createDefaultTriggerNode(
                triggerName,
                triggerID
            )
            setNodes([defaultTrigger])
            setEdges([])
        },

        // Get canvas data in API format
        getCanvasData: () => convertCanvasDataForAPI(nodes, edges),

        // Load canvas data from API format
        loadCanvas: data => {
            // Mark that we're loading data from the server to prevent default node creation
            setDataLoaded()

            // Process the loaded data
            const { nodes: loadedNodes, edges: loadedEdges } = processApiData(
                data,
                triggerName,
                triggerID,
                deleteNode // Pass the deleteNode function to process API data
            )

            // Only update if we have valid data
            if (loadedNodes.length > 0) {
                setNodes(loadedNodes)
                setEdges(loadedEdges)
                setIsInitialized(true)
                console.log(
                    'Loaded saved canvas data with',
                    loadedNodes.length,
                    'nodes'
                )
            } else {
                console.warn('No valid nodes found in loaded data')
            }
        }
    }))

    return (
        <motion.div
            className={`w-full h-[calc(100vh-200px)] bg-white rounded-xl border p-2 transition-all duration-300 ${
                isDraggingOver
                    ? 'border-blue-500 shadow-lg bg-blue-50'
                    : 'border-gray-300'
            }`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                connectionRadius={100}
                nodesDraggable={true}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                nodeTypes={nodeTypes}
                defaultEdgeOptions={{
                    animated: true,
                    style: { stroke: '#f97316', strokeWidth: 2 }
                }}
            >
                <FlowBackground />
                <FlowControls />
                <FlowMiniMap />
            </ReactFlow>

            {/* Show drop indicator when dragging over canvas */}
            {isDraggingOver && <DropIndicator />}
        </motion.div>
    )
})

export default WorkflowCanvas
