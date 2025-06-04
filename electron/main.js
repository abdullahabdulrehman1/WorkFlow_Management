import { app, BrowserWindow, ipcMain, Notification } from 'electron';
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

// Set Windows-specific settings for better notifications
if (process.platform === 'win32') {
  // Set app user model ID for Windows notifications
  app.setAppUserModelId('com.workflow.management.desktop');
  
  // Enable Windows 10/11 toast notifications
  app.setAppUserModelId('Workflow Management');
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
    
    console.log('✅ Electron app initialized successfully');
  } catch (error) {
    console.error('❌ Error creating window:', error);
  }
};

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