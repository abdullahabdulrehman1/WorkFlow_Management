import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the current viewport matches mobile breakpoint
 * Uses Tailwind's default sm breakpoint (640px)
 * @returns {boolean} true if viewport is mobile size
 */
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check initial screen size
    const checkIfMobile = () => {
      // This matches Tailwind's sm breakpoint (640px)
      setIsMobile(window.innerWidth < 640);
    };

    // Run once on mount
    checkIfMobile();

    // Set up event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
}