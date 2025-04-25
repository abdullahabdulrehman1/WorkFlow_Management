import { Menu } from '@headlessui/react';
import { useFloating, offset, flip, shift, autoUpdate, size } from '@floating-ui/react';
import { useEffect, useRef } from 'react';
import { MoreVertical } from 'lucide-react';
import { useDropdown } from '../context/DropdownContext';

export default function Dropdown({ actions, onActionClick, item }) {
  const dropdownContainerRef = useRef(null);
  const { dropdownRef, setDropdownRef } = useDropdown();

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
        },
      }),
    ],
  });

  useEffect(() => {
    if (refs.reference.current && refs.floating.current) {
      return autoUpdate(refs.reference.current, refs.floating.current, update);
    }
  }, [refs.reference, refs.floating, update]);

  const handleToggle = () => {
    // Toggle the dropdown
    if (dropdownRef === dropdownContainerRef.current) {
      setDropdownRef(null);
    } else {
      setDropdownRef(dropdownContainerRef.current);
    }
  };

  // Handle action click
  const handleActionClick = (action) => {
    if (onActionClick) {
      onActionClick(action, item);
    }
    // Close the dropdown after action
    setDropdownRef(null);
  };

  return (
    <Menu as="div" className="relative inline-block text-left" ref={dropdownContainerRef}>
      <Menu.Button
        ref={refs.setReference}
        onClick={handleToggle}
        className="p-2 hover:bg-sky-100 rounded-full border border-sky-300 transition"
      >
        <MoreVertical className="w-5 h-5 text-sky-600" />
      </Menu.Button>

      {dropdownRef === dropdownContainerRef.current && (
        <Menu.Items
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 w-44 bg-white rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none text-sm overflow-hidden"
        >
          {actions.map((action, idx) => (
            <Menu.Item key={idx}>
              {({ active }) => (
                <button
                  onClick={() => handleActionClick(action)}
                  className={`w-full text-left px-4 py-2 transition ${
                    action === 'Delete' ? 'text-red-600' : ''
                  } ${active ? 'bg-gray-100' : ''}`}
                >
                  {action}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      )}
    </Menu>
  );
}
