import React, { useState } from 'react'
import {
    LucideMail,
    LucideMessageCircle,
    LucideBell,
    LucideDatabase,
    LucideGlobe,
    LucideClock,
    LucideGitBranch,
    LucideZap,
    LucideX
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Handle, Position } from '@xyflow/react'

const ActionNode = ({ data }) => {
    const [isHovered, setIsHovered] = useState(false)

    // Determine icon and style based on action_id first, then fallback to label
    let Icon, bgClass, borderClass

    // Use action_id as the primary identifier (more reliable than label)
    if (data.action_id) {
        switch (data.action_id) {
            case 1: // Send Email
                Icon = LucideMail
                bgClass = 'bg-blue-100'
                borderClass = 'border-blue-300'
                break
            case 2: // Send SMS
                Icon = LucideMessageCircle
                bgClass = 'bg-yellow-100'
                borderClass = 'border-yellow-300'
                break
            case 3: // In-app notification
                Icon = LucideBell
                bgClass = 'bg-pink-100'
                borderClass = 'border-pink-300'
                break
            case 4: // Create Record
                Icon = LucideDatabase
                bgClass = 'bg-green-100'
                borderClass = 'border-green-300'
                break
            case 5: // HTTP Request
                Icon = LucideGlobe
                bgClass = 'bg-purple-100'
                borderClass = 'border-purple-300'
                break
            case 6: // Wait/Delay
                Icon = LucideClock
                bgClass = 'bg-orange-100'
                borderClass = 'border-orange-300'
                break
            case 7: // Condition/Branch
                Icon = LucideGitBranch
                bgClass = 'bg-indigo-100'
                borderClass = 'border-indigo-300'
                break
            default:
                Icon = LucideZap
                bgClass = 'bg-gray-100'
                borderClass = 'border-gray-300'
        }
    } else {
        // Fallback to label-based identification (for backward compatibility)
        switch (data.label) {
            case 'Send Email':
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
            case 'Create Record':
                Icon = LucideDatabase
                bgClass = 'bg-green-100'
                borderClass = 'border-green-300'
                break
            case 'HTTP Request':
                Icon = LucideGlobe
                bgClass = 'bg-purple-100'
                borderClass = 'border-purple-300'
                break
            case 'Wait/Delay':
                Icon = LucideClock
                bgClass = 'bg-orange-100'
                borderClass = 'border-orange-300'
                break
            case 'Condition/Branch':
                Icon = LucideGitBranch
                bgClass = 'bg-indigo-100'
                borderClass = 'border-indigo-300'
                break
            default:
                Icon = LucideZap
                bgClass = 'bg-gray-100'
                borderClass = 'border-gray-300'
        }
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`relative rounded-xl ${bgClass} border-2 ${borderClass} shadow-md px-4 py-3 text-sm text-black flex items-center gap-3 transition-all duration-200 hover:scale-105 cursor-pointer`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Handle
                type='target'
                position={Position.Top}
                id='action-input'
                className={`transition-all duration-200 rounded-full bg-gray-500 border-2 border-white ${
                    isHovered ? 'w-8 h-8 shadow-md' : 'w-3 h-3'
                }`}
                style={{
                    outline: isHovered ? '3px solid #CBD5E0' : 'none',
                    outlineOffset: '2px'
                }}
            />
            <Handle
                type='source'
                position={Position.Bottom}
                id='action-output'
                className={`transition-all duration-200 rounded-full bg-gray-500 border-2 border-white ${
                    isHovered ? 'w-8 h-8 shadow-md' : 'w-3 h-3'
                }`}
                style={{
                    outline: isHovered ? '3px solid #CBD5E0' : 'none',
                    outlineOffset: '2px'
                }}
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

export default ActionNode
