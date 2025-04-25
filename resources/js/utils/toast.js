import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import React from 'react';

/**
 * Morph-styled toast notifications with animation effects
 * A reusable toast utility for the workflow management system
 */

// Morph-style toast animations using Framer Motion
const ToastContent = ({ message, icon }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8, y: -10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.8, y: -10 }}
    transition={{ 
      type: "spring", 
      stiffness: 400,
      damping: 25
    }}
    className="flex items-center gap-2"
  >
    {icon && <span className="text-lg">{icon}</span>}
    <span>{message}</span>
  </motion.div>
);

// Common toast configuration
const baseConfig = {
  position: 'top-center',
  duration: 3000,
  style: {
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    color: '#000',
    padding: '12px 16px',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    fontSize: '14px',
    fontWeight: '500',
    maxWidth: '450px',
    border: '1px solid rgba(230, 230, 230, 0.5)',
  },
};

// Specific toast styles
const styles = {
  success: {
    style: {
      background: 'rgba(52, 211, 153, 0.9)',
      color: '#fff',
      border: '1px solid rgba(16, 185, 129, 0.7)',
    },
    icon: '✅',
  },
  error: {
    duration: 4000,
    style: {
      background: 'rgba(239, 68, 68, 0.9)',
      color: '#fff',
      border: '1px solid rgba(220, 38, 38, 0.7)',
    },
    icon: '❌',
  },
  loading: {
    style: {
      background: 'rgba(59, 130, 246, 0.9)',
      color: '#fff',
      border: '1px solid rgba(29, 78, 216, 0.7)',
    },
  },
};

// Reusable toast API
const toastService = {
  success: (message) => 
    toast.success(
      (t) => <ToastContent message={message} icon={styles.success.icon} />,
      { ...baseConfig, ...styles.success }
    ),
    
  error: (message) => 
    toast.error(
      (t) => <ToastContent message={message} icon={styles.error.icon} />,
      { ...baseConfig, ...styles.error }
    ),
    
  loading: (message) => 
    toast.loading(
      (t) => <ToastContent message={message} />,
      { ...baseConfig, ...styles.loading }
    ),
    
  dismiss: toast.dismiss,
  
  custom: (message, options = {}) => {
    const { icon, ...customOptions } = options;
    return toast.custom(
      (t) => <ToastContent message={message} icon={icon} />,
      { ...baseConfig, ...customOptions }
    );
  }
};

export default toastService;