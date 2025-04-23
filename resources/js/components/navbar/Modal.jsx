export default function Modal({ children }) {
    return (
        <div className='absolute right-0 mt-2 w-48 bg-white bg-opacity-80 backdrop-blur-md rounded-lg shadow-lg p-4'>
            {children}
        </div>
    );
}