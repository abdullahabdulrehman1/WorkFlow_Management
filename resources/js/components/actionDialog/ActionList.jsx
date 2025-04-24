import React from 'react'
import { ActionItem } from './ReusableComponents'

const ActionList = ({ actions }) => {
    return (
        <div className='flex flex-col gap-2 overflow-y-auto'>
            {actions.map((action, i) => (
                <ActionItem
                    key={i}
                    action={action}
                    onDragStart={e => {
                        console.log('Drag started with:', {
                            label: action.label,
                            type: action.type
                        })
                        e.dataTransfer.setData(
                            'application/reactflow',
                            JSON.stringify({
                                label: action.label,
                                type: action.type
                            })
                        )
                        e.dataTransfer.effectAllowed = 'move'
                    }}
                />
            ))}
        </div>
    )
}

export default ActionList
