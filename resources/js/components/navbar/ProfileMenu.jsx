import { motion } from 'framer-motion'

export default function ProfileMenu() {
    const itemVariants = {
        hidden: { opacity: 0, y: 5 },
        visible: i => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.2
            }
        })
    };

    return (
        <div className='absolute right-0 mt-2 w-48 bg-white bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg p-4'>
            <ul className='text-gray-700'>
                <motion.li 
                    custom={0} 
                    initial="hidden" 
                    animate="visible" 
                    variants={itemVariants}
                    className='cursor-pointer hover:text-sky-500'
                    whileHover={{ x: 3 }}
                >
                    Logout
                </motion.li>
                <li className='border-t border-gray-300 my-2'></li>
                <motion.li 
                    custom={1} 
                    initial="hidden" 
                    animate="visible" 
                    variants={itemVariants}
                    className='cursor-pointer hover:text-sky-500'
                    whileHover={{ x: 3 }}
                >
                    View Logs
                </motion.li>
            </ul>
        </div>
    );
}