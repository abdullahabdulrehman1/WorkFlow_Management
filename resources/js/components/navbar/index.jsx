import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Sun, Moon, Bell, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { router } from '@inertiajs/react'
import ToggleSwitch from './ToggleSwitch'
import Modal from './Modal'
import ProfileMenu from './ProfileMenu'
import SettingsMenu from './SettingsMenu'

export default function TopNavbar () {
    const [isToggled, setIsToggled] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const menuRef = useRef(null)

    const handleToggle = () => {
        setIsToggled(!isToggled)
    }

    const toggleModal = modalName => {
        setActiveModal(activeModal === modalName ? null : modalName)
    }

    // Handle clicks outside the menu components
    useEffect(() => {
        function handleClickOutside (event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveModal(null)
            }
        }

        // Add event listener when a modal is open
        if (activeModal) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        // Clean up the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [activeModal])

    // Menu animation variants
    const menuVariants = {
        hidden: {
            opacity: 0,
            y: -10,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.2,
                ease: 'easeOut'
            }
        },
        exit: {
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: {
                duration: 0.1,
                ease: 'easeIn'
            }
        }
    }

    return (
        <div className='bg-gradient-to-br from-white/30 via-gray-100/30 to-gray-200/30 backdrop-blur-md px-4 py-2 flex flex-col sm:flex-row justify-between items-center rounded-3xl shadow text-sm'>
            {/* Left - Back & Automations */}
            <div className='flex items-center gap-2 mb-2 sm:mb-0'>
                <button
                    className='bg-white p-2 cursor-pointer rounded-full shadow-sm hover:bg-gray-100 transition-colors'
                    onClick={() => router.visit('/workflows')}
                >
                    <ChevronLeft className='w-4 h-4 text-sky-600' />
                </button>
                <div
                    className='flex cursor-pointer items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm'
                    onClick={() => router.visit('/workflows')}
                >
                    <img
                        src='/settings.png'
                        alt='automation'
                        className='w-4 h-4'
                    />
                    <span className='text-gray-700 font-medium'>
                        Automations
                    </span>
                </div>
            </div>

            {/* Center - Logo */}
            <div className='flex items-center gap-2 mb-2 sm:mb-0'>
                <img src='/logo.png' alt='360' className='w-16 h-6' />
            </div>

            {/* Right - Icons + Avatar */}
            <div className='flex items-center gap-4' ref={menuRef}>
                <ToggleSwitch isToggled={isToggled} onToggle={handleToggle} />
                <div className='relative'>
                    <Bell
                        className='w-4 h-4 text-gray-600 cursor-pointer'
                        onClick={() => toggleModal('notification')}
                    />
                    <AnimatePresence>
                        {activeModal === 'notification' && (
                            <motion.div
                                variants={menuVariants}
                                initial='hidden'
                                animate='visible'
                                exit='exit'
                            >
                                <Modal>
                                    <p className='text-gray-500'>
                                        No notifications
                                    </p>
                                </Modal>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className='relative'>
                    <Settings
                        className='w-4 h-4 text-gray-600 cursor-pointer'
                        onClick={() => toggleModal('settings')}
                    />
                    <AnimatePresence>
                        {activeModal === 'settings' && (
                            <motion.div
                                variants={menuVariants}
                                initial='hidden'
                                animate='visible'
                                exit='exit'
                            >
                                <SettingsMenu />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <div className='relative'>
                    <img
                        src='/profile.png'
                        alt='user'
                        className='w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer'
                        onClick={() => toggleModal('profile')}
                    />
                    <AnimatePresence>
                        {activeModal === 'profile' && (
                            <motion.div
                                variants={menuVariants}
                                initial='hidden'
                                animate='visible'
                                exit='exit'
                            >
                                <ProfileMenu />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
