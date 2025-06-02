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