import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Menu, Bell, Settings, X, Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { router } from '@inertiajs/react'
import ToggleSwitch from './ToggleSwitch'
import Modal from './Modal'
import ProfileMenu from './ProfileMenu'
import SettingsMenu from './SettingsMenu'
import { useFloating, offset, flip, shift, autoUpdate, size } from '@floating-ui/react'

export default function MobileNavbar() {
    const [isToggled, setIsToggled] = useState(false)
    const [activeModal, setActiveModal] = useState(null)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef(null)
    const menuButtonRef = useRef(null)

    // Floating UI setup for dropdown menu
    const { refs, floatingStyles, update } = useFloating({
        placement: 'bottom-end',
        middleware: [
            offset(10),
            flip(),
            shift(),
            size({
                apply({ availableWidth, availableHeight, elements }) {
                    elements.floating.style.maxWidth = `${availableWidth}px`;
                    elements.floating.style.maxHeight = `${availableHeight}px`;
                    elements.floating.style.overflow = 'auto';
                }
            })
        ]
    })

    useEffect(() => {
        if (refs.reference.current && refs.floating.current && menuOpen) {
            return autoUpdate(refs.reference.current, refs.floating.current, update);
        }
    }, [refs.reference, refs.floating, update, menuOpen]);

    const handleToggle = () => {
        setIsToggled(!isToggled)
    }

    const toggleModal = modalName => {
        setActiveModal(activeModal === modalName ? null : modalName)
    }

    const toggleMenu = () => {
        setMenuOpen(!menuOpen)
    }

    // Handle clicks outside the menu components
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target) &&
                (!menuButtonRef.current || !menuButtonRef.current.contains(event.target))) {
                setActiveModal(null)
                setMenuOpen(false)
            }
        }

        // Add event listener when a modal or menu is open
        if (activeModal || menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        // Clean up the event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [activeModal, menuOpen])

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
        <div className='bg-gradient-to-br from-white/30 via-gray-100/30 to-gray-200/30 backdrop-blur-md px-4 py-3 rounded-3xl shadow text-sm relative z-50'>
            {/* Top bar with logo, back button and menu toggle */}
            <div className='flex justify-between items-center'>
                <div className='flex items-center gap-2'>
                    <button
                        className='bg-white p-2 cursor-pointer rounded-full shadow-sm hover:bg-gray-100 transition-colors'
                        onClick={() => router.visit('/workflows')}
                    >
                        <ChevronLeft className='w-4 h-4 text-sky-600' />
                    </button>
                    <img src='/logo.png' alt='360' className='w-16 h-6' />
                </div>

                <div className='flex items-center gap-3'>
                    <div className='relative' ref={menuRef}>
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
                                    className="absolute right-0 mt-2 z-50"
                                >
                                    <ProfileMenu />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        ref={refs.setReference}
                        className='bg-white p-2 cursor-pointer rounded-full shadow-sm hover:bg-gray-100 transition-colors'
                        onClick={toggleMenu}
                    >
                        <Menu className='w-4 h-4 text-sky-600' />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                ref={refs.setFloating}
                                style={floatingStyles}
                                variants={menuVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="z-50 bg-white rounded-lg shadow-lg ring-1 ring-black/5 text-sm p-2 min-w-[220px]"
                            >
                                <div className="py-1">
                                    {/* Automations */}
                                    <div
                                        className='flex cursor-pointer items-center gap-2 px-4 py-3 hover:bg-blue-50 rounded-md transition-colors'
                                        onClick={() => {
                                            router.visit('/workflows')
                                            setMenuOpen(false)
                                        }}
                                    >
                                        <img
                                            src='/settings.png'
                                            alt='automation'
                                            className='w-5 h-5'
                                        />
                                        <span className='text-gray-700 font-medium'>
                                            Automations
                                        </span>
                                    </div>

                                    {/* Divider */}
                                    <div className="my-2 border-t border-gray-100"></div>

                                    {/* Notifications */}
                                    <div
                                        className='flex cursor-pointer items-center justify-between gap-2 px-4 py-3 hover:bg-blue-50 rounded-md transition-colors'
                                        onClick={() => {
                                            toggleModal('notification')
                                            setMenuOpen(false)
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Bell className="w-5 h-5 text-gray-600" />
                                            <span className='text-gray-700'>Notifications</span>
                                        </div>
                                    </div>

                                    {/* Settings */}
                                    <div
                                        className='flex cursor-pointer items-center justify-between gap-2 px-4 py-3 hover:bg-blue-50 rounded-md transition-colors'
                                        onClick={() => {
                                            toggleModal('settings')
                                            setMenuOpen(false)
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Settings className="w-5 h-5 text-gray-600" />
                                            <span className='text-gray-700'>Settings</span>
                                        </div>
                                    </div>

                                    {/* Theme Toggle */}
                                    <div className='flex cursor-pointer items-center justify-between gap-2 px-4 py-3 hover:bg-blue-50 rounded-md transition-colors'>
                                        <div className="flex items-center gap-2">
                                            {isToggled ? (
                                                <Moon className="w-5 h-5 text-gray-600" />
                                            ) : (
                                                <Sun className="w-5 h-5 text-gray-600" />
                                            )}
                                            <span className='text-gray-700'>
                                                {isToggled ? 'Dark Mode' : 'Light Mode'}
                                            </span>
                                        </div>
                                        <ToggleSwitch isToggled={isToggled} onToggle={handleToggle} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {activeModal === 'notification' && (
                    <motion.div
                        variants={menuVariants}
                        initial='hidden'
                        animate='visible'
                        exit='exit'
                        className="fixed inset-x-0 top-20 mx-auto w-[90%] z-50"
                    >
                        <Modal>
                            <p className='text-gray-500'>
                                No notifications
                            </p>
                        </Modal>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {activeModal === 'settings' && (
                    <motion.div
                        variants={menuVariants}
                        initial='hidden'
                        animate='visible'
                        exit='exit'
                        className="fixed inset-x-0 top-20 mx-auto w-[90%] z-50"
                    >
                        <SettingsMenu />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}