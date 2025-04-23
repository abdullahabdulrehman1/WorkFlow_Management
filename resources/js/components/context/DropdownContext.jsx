import { createContext, useContext, useState, useEffect } from 'react';

const DropdownContext = createContext();

export const DropdownProvider = ({ children }) => {
  const [dropdownRef, setDropdownRef] = useState(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef && !dropdownRef.contains(event.target)) {
        setDropdownRef(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  return (
    <DropdownContext.Provider value={{ dropdownRef, setDropdownRef }}>
      {children}
    </DropdownContext.Provider>
  );
};

export const useDropdown = () => useContext(DropdownContext);
