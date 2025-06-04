import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our reusable components
import MainWindowManager from './src/windows/MainWindowManager.js';
import CallWindowManager from './src/windows/CallWindowManager.js';
import NotificationService from './src/services/NotificationService.js';
import IPCHandler from './src/utils/IPCHandler.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize managers
let mainWindowManager;
let callWindowManager;
let notificationService;
let ipcHandler;

// Set Windows-specific settings
if (process.platform === 'win32') {
  // Set app user model ID for Windows notifications
  app.setAppUserModelId('com.workflow.management.desktop');
}

// Create main window function
const createWindow = async () => {
  try {
    console.log('🚀 Creating Electron main window...');
    
    // Initialize all managers
    mainWindowManager = new MainWindowManager();
    callWindowManager = new CallWindowManager();
    notificationService = new NotificationService(mainWindowManager, callWindowManager);
    ipcHandler = new IPCHandler(mainWindowManager, callWindowManager, notificationService);

    // Create the main window
    await mainWindowManager.create();
    
    // Set up IPC handlers
    setupIPCHandlers();
    
    // Test notification after window is created
    setTimeout(async () => {
      try {
        console.log('📢 Testing notification...');
        const result = await notificationService.showCallNotification({
          callId: 'test-call',
          isVideoCall: false,
          contactName: 'Test User',
          callerId: '123',
          callerName: 'Test User'
        });
        console.log('📢 Notification test result:', result);
      } catch (error) {
        console.error('❌ Error testing notification:', error);
      }
    }, 3000);
  } catch (error) {
    console.error('❌ Error creating window:', error);
  }
};

// Set up IPC handlers
function setupIPCHandlers() {
  // Handle incoming call notification
  ipcMain.handle('notification:incoming-call', async (event, callData) => {
    try {
      console.log('📢 Received incoming call notification request:', callData);
      const result = await notificationService.showCallNotification(callData);
      return { success: result };
    } catch (error) {
      console.error('❌ Error handling incoming call notification:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle opening call window
  ipcMain.handle('call:open-window', async (event, callData) => {
    try {
      console.log('📞 Opening call window:', callData);
      await callWindowManager.create(callData);
      return { success: true };
    } catch (error) {
      console.error('❌ Error opening call window:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle closing call window
  ipcMain.handle('call:close-window', async () => {
    try {
      console.log('📞 Closing call window');
      callWindowManager.close();
      return { success: true };
    } catch (error) {
      console.error('❌ Error closing call window:', error);
      return { success: false, error: error.message };
    }
  });

  // Handle getting call window status
  ipcMain.handle('call:get-status', async () => {
    try {
      const status = callWindowManager.getStatus();
      return { success: true, ...status };
    } catch (error) {
      console.error('❌ Error getting call window status:', error);
      return { success: false, error: error.message };
    }
  });
}

// When Electron has finished initialization, create the window
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS re-create a window when dock icon is clicked with no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});