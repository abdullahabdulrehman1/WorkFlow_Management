import React from 'react'
import {
    LucideMail,
    LucideMessageCircle,
    LucideBell,
    LucideZap,
    LucideX
} from 'lucide-react'
import { motion } from 'framer-motion'

import { Handle, Position } from '@xyflow/react'

export const TriggerNode = ({ data }) => (
    <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className='group relative rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-lg hover:shadow-xl hover:border-orange-400 transition-all duration-200'
    >
        <motion.div
            whileHover={{ scale: 1.15 }}
            transition={{ type: 'spring', stiffness: 300 }}
        >
            <Handle
                type='source'
                position={Position.Bottom}
                className='w-4 h-4 bg-blue-600 rounded-full border-2 border-white'
            />
        </motion.div>

        <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 p-1.5 border-dashed border-2 border-orange-300'>
                <LucideZap className='h-5 w-5 text-orange-600' />
            </div>
            <div className='flex-1'>
                <h3 className='text-sm font-semibold text-gray-800'>
                    {data.label}
                </h3>
                <p className='text-xs text-orange-700/80 mt-1'>Trigger node</p>
            </div>
        </div>
    </motion.div>
)

export const ActionNode = ({ data }) => {
    let Icon, bgClass, borderClass
    switch (data.label) {
        case 'Send email':
            Icon = LucideMail
            bgClass = 'bg-blue-100'
            borderClass = 'border-blue-300'
            break
        case 'Send SMS':
            Icon = LucideMessageCircle
            bgClass = 'bg-yellow-100'
            borderClass = 'border-yellow-300'
            break
        case 'In-app notification':
            Icon = LucideBell
            bgClass = 'bg-pink-100'
            borderClass = 'border-pink-300'
            break
        default:
            Icon = LucideZap
            bgClass = 'bg-gray-100'
            borderClass = 'border-gray-300'
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`relative rounded-xl ${bgClass} border-2 ${borderClass} shadow-md px-4 py-3 text-sm text-black flex items-center gap-3 transition-all duration-200 hover:scale-105 cursor-pointer`}
        >
            <Handle
                type='target'
                position={Position.Top}
                id='action-input'
                className='w-3 h-3 rounded-full bg-gray-500 border-2 border-white'
            />
            <Handle
                type='source'
                position={Position.Bottom}
                id='action-output'
                className='w-3 h-3 rounded-full bg-gray-500 border-2 border-white'
            />

            {data.onDelete && (
                <button
                    onClick={data.onDelete}
                    className='absolute top-1 right-1 text-gray-400 hover:text-red-500'
                >
                    <LucideX size={16} />
                </button>
            )}

            {Icon && (
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border-dashed border-2 ${borderClass}`}
                >
                    <Icon className='w-5 h-5 text-black' />
                </div>
            )}
            <div className='flex flex-col'>
                <span className='text-sm font-semibold'>{data.label}</span>
                <span className='text-[10px] text-gray-500'>Action node</span>
            </div>
        </motion.div>
    )
}

export const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode
}
