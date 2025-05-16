import { useCallback, useImperativeHandle, forwardRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Maximize2, Minimize2 } from 'lucide-react'

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
import useIsMobile from '../../hooks/useIsMobile'

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
    const { workflowName, triggerName, triggerID, onFullscreenChange } = props
    const isMobile = useIsMobile()
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Initialize states for nodes and edges
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    // Get the React Flow utility for coordinate conversion
    const { screenToFlowPosition, fitView } = useReactFlow()

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

    // Toggle fullscreen mode
    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev)
        // Give the DOM time to update before refitting the view
        setTimeout(() => fitView({ duration: 300 }), 50)
    }, [fitView])
    
    // Notify parent component when fullscreen state changes
    useEffect(() => {
        if (onFullscreenChange) {
            onFullscreenChange(isFullscreen)
        }
    }, [isFullscreen, onFullscreenChange])
    
    // Function to add a node at a specific position - used by mobile action tap event
    const addNodeToCanvas = useCallback((actionData, flowPosition) => {
        // Generate a stable numeric ID that won't conflict with existing nodes
        const timestamp = Date.now();
        const numericId = String(timestamp % 1000000000 + 100);
        
        // Create the new node
        const newNode = {
            id: numericId,
            type: actionData.type || 'action',
            position: flowPosition,
            data: {
                label: actionData.label || 'Action Node',
                action_id: actionData.action_id,
                configuration: {},
                onDelete: () => deleteNode(numericId)
            },
            draggable: true
        };
        
        // Add the new node to the canvas
        setNodes(nds => {
            // Prevent duplicates
            if (nds.some(n => n.id === numericId)) {
                console.warn(`Prevented duplicate node creation with ID: ${numericId}`);
                return nds;
            }
            return nds.concat(newNode);
        });
        
        // Fit view after adding the node
        setTimeout(() => fitView({ padding: 0.2 }), 50);
        
        console.log('Added new node to canvas:', newNode);
        return numericId;
    }, [setNodes, deleteNode, fitView]);

    // Poll for global variable to overcome mobile touch limitations
    useEffect(() => {
        // Set up poll for the global variable approach
        const intervalId = setInterval(() => {
            if (window.mobileWorkflowAction) {
                const { action, timestamp } = window.mobileWorkflowAction;
                
                // Only process if it's recent (within last 2 seconds)
                if (Date.now() - timestamp < 2000) {
                    console.log('Found mobile action via global variable:', action);
                    
                    // Get center position of the canvas
                    const flowPosition = { x: 300, y: 200 };
                    
                    // Add the node and clear the global variable
                    addNodeToCanvas(action, flowPosition);
                    window.mobileWorkflowAction = null;
                }
            }
        }, 300); // Check frequently
        
        // Clean up
        return () => {
            clearInterval(intervalId);
        };
    }, [addNodeToCanvas]);

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

    // Calculate height based on device and fullscreen mode
    const canvasHeight = isMobile 
        ? isFullscreen 
            ? 'h-screen fixed inset-0 z-50' 
            : 'h-[calc(100vh-120px)]'
        : 'h-[calc(100vh-200px)]'

    return (
        <motion.div
            className={`w-full ${canvasHeight} bg-white rounded-xl border p-2 transition-all duration-300 ${
                isDraggingOver
                    ? 'border-blue-500 shadow-lg bg-blue-50'
                    : 'border-gray-300'
            } ${isFullscreen ? 'rounded-none' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            {/* Fullscreen toggle button */}
            {isMobile && (
                <button 
                    className="absolute top-2 right-2 z-20 bg-white p-2 rounded-full shadow-md border border-gray-200"
                    onClick={toggleFullscreen}
                >
                    {isFullscreen ? (
                        <Minimize2 size={18} className="text-gray-600" />
                    ) : (
                        <Maximize2 size={18} className="text-gray-600" />
                    )}
                </button>
            )}
            
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
