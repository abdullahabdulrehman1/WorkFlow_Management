import { useCallback, useState, useImperativeHandle, forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow
} from '@xyflow/react'
import { nodeTypes } from './NodeTypes'
import '@xyflow/react/dist/style.css'

const initialNodes = [
    {
        id: '1',
        type: 'trigger',
        position: { x: 300, y: 50 },
        data: { label: 'New Customer/Prospect (Manual)' }
    },
    {
        id: '2',
        type: 'action',
        position: { x: 300, y: 200 },
        data: { label: 'Send an SMS' }
    }
]

const initialEdges = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
        animated: true,
        style: { stroke: '#f97316', strokeWidth: 2 }
    }
]

const WorkflowCanvas = forwardRef((props, ref) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
    const [isDraggingOver, setIsDraggingOver] = useState(false)
    const { screenToFlowPosition } = useReactFlow()
    
    // Expose the clearCanvas method to parent components through ref
    useImperativeHandle(ref, () => ({
        clearCanvas: () => {
            // Reset to initial state instead of clearing everything
            setNodes([...initialNodes])
            setEdges([...initialEdges])
        }
    }))

    const onConnect = params => setEdges(eds => addEdge(params, eds))

    const deleteNode = useCallback(
        id => {
            // Don't allow deletion of initial nodes (IDs '1' and '2')
            if (id === '1' || id === '2') return;
            
            setNodes(nds => nds.filter(node => node.id !== id))
            setEdges(eds =>
                eds.filter(edge => edge.source !== id && edge.target !== id)
            )
        },
        [setNodes, setEdges]
    )

    const onDrop = useCallback(
        event => {
            event.preventDefault()
            setIsDraggingOver(false)

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY
            })

            const data = JSON.parse(
                event.dataTransfer.getData('application/reactflow')
            )
            const newId = `${Date.now()}`

            const newNode = {
                id: newId,
                type: data.type,
                position,
                data: {
                    label: data.label,
                    onDelete: () => deleteNode(newId)
                },
                draggable: true
            }

            setNodes(nds => nds.concat(newNode))
        },
        [screenToFlowPosition, setNodes, deleteNode]
    )

    const onDragOver = useCallback(event => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        setIsDraggingOver(true)
    }, [])

    const onDragLeave = useCallback(() => {
        setIsDraggingOver(false)
    }, [])

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
                <Background
                    variant='dots'
                    gap={32}
                    size={1.5}
                    color='black'
                    className='opacity-50'
                />
                <Controls showInteractive={false} position='top-left' />
                <MiniMap
                    nodeColor={n =>
                        n.type === 'trigger' ? '#fb923c' : '#facc15'
                    }
                    position='bottom-left'
                />
            </ReactFlow>

            {isDraggingOver && (
                <div className='absolute inset-0 flex items-center justify-center text-blue-500 font-semibold pointer-events-none'>
                    Drop here to add action
                </div>
            )}
        </motion.div>
    )
})

export default WorkflowCanvas
