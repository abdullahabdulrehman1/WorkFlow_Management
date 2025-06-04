const { contextBridge, ipcRenderer } = require('electron');

// Log that we're in Electron environment
console.log('🚀 PRELOAD SCRIPT LOADING - Running in Electron environment');
console.log('📦 Electron version:', process.versions.electron);
console.log('🌐 Node version:', process.versions.node);

// Test if contextBridge is working
console.log('🔧 contextBridge available:', typeof contextBridge);

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
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
      // Simple notification - this is what you need for basic Windows notifications
      showSimple: async (title, body) => {
        return await ipcRenderer.invoke('show-simple-notification', { title, body });
      },
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
  console.log('✅ Successfully exposed electron APIs to renderer');
} catch (error) {
  console.error('❌ Failed to expose electron APIs:', error);
}