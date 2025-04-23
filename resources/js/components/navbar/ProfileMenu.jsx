export default function ProfileMenu() {
    return (
        <div className='absolute right-0 mt-2 w-48 bg-white bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg p-4'>
            <ul className='text-gray-700'>
                <li className='cursor-pointer hover:text-sky-500'>Logout</li>
                <li className='border-t border-gray-300 my-2'></li>
                <li className='cursor-pointer hover:text-sky-500'>View Logs</li>
            </ul>
        </div>
    );
}