import React from 'react'
import { LucideZap } from 'lucide-react'
import { motion } from 'framer-motion'
import { Handle, Position } from '@xyflow/react'

const TriggerNode = ({ data }) => (
    <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className='group relative rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-4 shadow-lg hover:shadow-xl hover:border-orange-400 transition-all duration-200'
    >
        <Handle
            type='source'
            position={Position.Bottom}
            className='w-4 h-4 bg-blue-600 rounded-full border-2 border-white'
            style={{ zIndex: 10 }}
        />

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

export default TriggerNode