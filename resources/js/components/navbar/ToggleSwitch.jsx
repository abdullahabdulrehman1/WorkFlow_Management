export default function ToggleSwitch({ isToggled, onToggle }) {
    return (
        <div
            className={`relative w-8 h-4 bg-white rounded-full p-0.5 flex items-center shadow-inner cursor-pointer ${isToggled ? 'justify-end' : 'justify-start'}`}
            onClick={onToggle}
        >
            <div className='w-3 h-3 bg-sky-500 rounded-full transition-all'></div>
        </div>
    );
}