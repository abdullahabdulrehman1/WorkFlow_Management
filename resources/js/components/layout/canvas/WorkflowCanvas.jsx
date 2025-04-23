import { useCallback } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge
} from '@xyflow/react'
import {ActionNode as nodeTypes } from './NodeTypes'
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

export default function WorkflowCanvas () {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

    const onConnect = params => setEdges(eds => addEdge(params, eds))

    const onDrop = useCallback(
        event => {
            event.preventDefault()
            console.log('Drop event:', event)
            const reactFlowBounds = event.target.getBoundingClientRect()
            const data = JSON.parse(
                event.dataTransfer.getData('application/reactflow')
            )
            console.log('Data received on drop:', data)

            // Calculate position relative to the canvas
            const position = {
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top
            }

            const newNode = {
                id: `${nodes.length + 1}`,
                type: data.type,
                position,
                data: { label: data.label }
            }
            setNodes(nds => nds.concat(newNode))
        },
        [nodes, setNodes]
    )

    const onDragOver = useCallback(event => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    return (
        <div
            className='w-full h-[calc(100vh-200px)] bg-white rounded-xl border p-2'
            onDrop={onDrop}
            onDragOver={onDragOver}
        >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                nodeTypes={nodeTypes}
            >
                <Background gap={32} size={1} color='#e2e8f0' />
                <Controls showInteractive={false} />
                <MiniMap />
            </ReactFlow>
        </div>
    )
}
