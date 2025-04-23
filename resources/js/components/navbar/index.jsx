import { useState } from 'react';
import { ChevronLeft, Sun, Moon, Bell, Settings } from 'lucide-react';
import ToggleSwitch from './ToggleSwitch';
import Modal from './Modal';
import ProfileMenu from './ProfileMenu';
import SettingsMenu from './SettingsMenu';

export default function TopNavbar() {
    const [isToggled, setIsToggled] = useState(false);
    const [activeModal, setActiveModal] = useState(null); // Track active modal

    const handleToggle = () => {
        setIsToggled(!isToggled);
    };

    const toggleModal = (modalName) => {
        setActiveModal(activeModal === modalName ? null : modalName);
    };

    return (
        <div 
        className='bg-gradient-to-br from-white/30 via-gray-100/30 to-gray-200/30 backdrop-blur-md px-4 py-2 flex justify-between items-center rounded-3xl shadow text-sm'>
            {/* Left - Back & Automations */}
            <div className='flex items-center gap-2'>
                <button className='bg-white p-2 rounded-full shadow-sm'>
                    <ChevronLeft className='w-4 h-4 text-sky-600' />
                </button>
                <div className='flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm'>
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
            <div className='flex items-center gap-2'>
                <img src='/logo.png' alt='360' className='w-16 h-6' />
            </div>

            {/* Right - Icons + Avatar */}
            <div className='flex items-center gap-4'>
                <ToggleSwitch isToggled={isToggled} onToggle={handleToggle} />
                <div className='relative'>
                    <Bell
                        className='w-4 h-4 text-gray-600 cursor-pointer'
                        onClick={() => toggleModal('notification')}
                    />
                    {activeModal === 'notification' && (
                        <Modal>
                            <p className='text-gray-500'>No notifications</p>
                        </Modal>
                    )}
                </div>
                <div className='relative'>
                    <Settings
                        className='w-4 h-4 text-gray-600 cursor-pointer'
                        onClick={() => toggleModal('settings')}
                    />
                    {activeModal === 'settings' && <SettingsMenu />}
                </div>
                <div className='relative'>
                    <img
                        src='/profile.png'
                        alt='user'
                        className='w-8 h-8 rounded-full border-2 border-white shadow-sm cursor-pointer'
                        onClick={() => toggleModal('profile')}
                    />
                    {activeModal === 'profile' && <ProfileMenu />}
                </div>
            </div>
        </div>
    );
}
