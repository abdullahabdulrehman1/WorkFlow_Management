import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // App info
  getAppInfo: () => {
    ipcRenderer.send('app-info');
    return new Promise((resolve) => {
      ipcRenderer.once('app-info-reply', (_, arg) => {
        resolve(arg);
      });
    });
  },
  
  // API for notifications
  notifications: {
    // Check if notifications are supported
    checkPermission: () => {
      return Notification.permission;
    },
    // Request permission
    requestPermission: async () => {
      return await Notification.requestPermission();
    },
    // Show native notification for incoming calls
    showCallNotification: async (callData) => {
      return await ipcRenderer.invoke('show-native-notification', callData);
    },
    // Show toast notification
    showToast: async (title, body, options = {}) => {
      return await ipcRenderer.invoke('show-toast-notification', title, body, options);
    },
    // Handle incoming call (native notification + window)
    handleIncomingCall: (callData) => {
      return ipcRenderer.invoke('notification:incoming-call', callData);
    },
    // Clear notification badge
    clearBadge: async () => {
      return await ipcRenderer.invoke('clear-notification-badge');
    },
    // Close specific notification
    closeNotification: async (callId) => {
      return await ipcRenderer.invoke('close-notification', callId);
    }
  },
  
  // Call window management
  call: {
    // Open a new call window
    openWindow: (callData) => {
      return ipcRenderer.invoke('call:open-window', callData);
    },
    // Close the call window
    closeWindow: () => {
      return ipcRenderer.invoke('call:close-window');
    },
    // Get call window status
    getStatus: () => {
      return ipcRenderer.invoke('call:get-status');
    }
  },
  
  // Versions
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
  },
  
  // System info
  system: {
    platform: process.platform
  }
});