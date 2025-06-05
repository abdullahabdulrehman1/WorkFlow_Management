import { app, BrowserWindow, ipcMain, Notification, Tray, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
let tray = null;

// Set Windows-specific settings for better notifications
if (process.platform === 'win32') {
  // Set app user model ID for Windows notifications
  app.setAppUserModelId('com.workflow.management.desktop');
  
  // Enable Windows 10/11 toast notifications
  app.setAppUserModelId('Workflow Management');
}

// Create system tray
function createTray() {
  // Get the appropriate icon path for system tray
  let trayIconPath;
  if (process.platform === 'win32') {
    // Try multiple Windows 11 icon paths in order of preference for system tray
    const possiblePaths = [
      path.join(__dirname, 'public/icons/windows11/Square44x44Logo.targetsize-16.png'),
      path.join(__dirname, 'public/icons/windows11/Square44x44Logo.targetsize-24.png'),
      path.join(__dirname, 'public/icons/windows11/Square44x44Logo.targetsize-32.png'),
      path.join(__dirname, 'public/icons/windows11/Square44x44Logo.altform-unplated_targetsize-16.png'),
      path.join(__dirname, 'public/icons/windows11/Square44x44Logo.altform-unplated_targetsize-24.png'),
      path.join(__dirname, 'public/icons/windows11/Square44x44Logo.altform-unplated_targetsize-32.png'),
      path.join(__dirname, 'public/logo.png') // Final fallback
    ];
    
    trayIconPath = possiblePaths.find(iconPath => {
      const exists = fs.existsSync(iconPath);
      if (exists) {
        console.log('🔧 Found tray icon:', iconPath);
      }
      return exists;
    });

    if (!trayIconPath) {
      console.warn('⚠️ No suitable tray icon found, using fallback');
      trayIconPath = path.join(__dirname, 'public/logo.png');
    }
  } else if (process.platform === 'darwin') {
    // For macOS, try to use appropriate icons
    const macPaths = [
      path.join(__dirname, 'public/icons/ios/icon.icns'),
      path.join(__dirname, 'public/icons/icon.png'),
      path.join(__dirname, 'public/logo.png')
    ];
    trayIconPath = macPaths.find(iconPath => fs.existsSync(iconPath)) || path.join(__dirname, 'public/logo.png');
  } else {
    // For Linux and other platforms
    const linuxPaths = [
      path.join(__dirname, 'public/icons/android/icon.png'),
      path.join(__dirname, 'public/icons/icon.png'),
      path.join(__dirname, 'public/logo.png')
    ];
    trayIconPath = linuxPaths.find(iconPath => fs.existsSync(iconPath)) || path.join(__dirname, 'public/logo.png');
  }

  console.log('🔧 Creating system tray with icon:', trayIconPath);

  try {
    tray = new Tray(trayIconPath);
    
    // Create context menu for tray with Windows 11 style
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '📂 Show Workflow Management',
        click: () => {
          if (mainWindowManager && !mainWindowManager.isDestroyed()) {
            mainWindowManager.show();
          } else {
            createWindow();
          }
        }
      },
      {
        label: '🔽 Hide to Tray',
        click: () => {
          if (mainWindowManager && !mainWindowManager.isDestroyed()) {
            mainWindowManager.getWindow().hide();
          }
        }
      },
      { type: 'separator' },
      {
        label: '📞 Desktop Calling',
        submenu: [
          {
            label: '🔔 Test Notification',
            click: () => {
              if (notificationService) {
                notificationService.showToastNotification(
                  '🔔 Test Notification',
                  'This is a test notification from the system tray!'
                );
              }
            }
          },
          {
            label: '📞 Test Voice Call',
            click: () => {
              if (notificationService) {
                notificationService.showCallNotification({
                  callId: 'test-voice-' + Date.now(),
                  callerName: 'System Tray Test',
                  contactName: 'Test Voice Caller',
                  isVideoCall: false,
                  callType: 'voice'
                });
              }
            }
          },
          {
            label: '📹 Test Video Call',
            click: () => {
              if (notificationService) {
                notificationService.showCallNotification({
                  callId: 'test-video-' + Date.now(),
                  callerName: 'System Tray Test',
                  contactName: 'Test Video Caller',
                  isVideoCall: true,
                  callType: 'video'
                });
              }
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: '❌ Quit Workflow Management',
        click: () => {
          console.log('🚪 Quitting from system tray...');
          app.isQuiting = true;
          if (tray) {
            tray.destroy();
            tray = null;
          }
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('Workflow Management - Running in background');

    // Handle tray icon click (show/hide window)
    tray.on('click', () => {
      console.log('🖱️ Tray icon clicked');
      if (mainWindowManager && !mainWindowManager.isDestroyed()) {
        const window = mainWindowManager.getWindow();
        if (window.isVisible()) {
          console.log('🔽 Hiding window to tray');
          window.hide();
        } else {
          console.log('🔼 Showing window from tray');
          mainWindowManager.show();
        }
      } else {
        console.log('🚀 Creating new window from tray');
        createWindow();
      }
    });

    // Handle double-click on tray (always show window)
    tray.on('double-click', () => {
      console.log('🖱️ Tray icon double-clicked - showing window');
      if (mainWindowManager && !mainWindowManager.isDestroyed()) {
        mainWindowManager.show();
      } else {
        createWindow();
      }
    });

    console.log('✅ System tray created successfully');
  } catch (error) {
    console.error('❌ Error creating system tray:', error);
  }
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
    
    // Create system tray
    createTray();
    
    console.log('✅ Electron app initialized successfully');
  } catch (error) {
    console.error('❌ Error creating window:', error);
  }
};

// When Electron has finished initialization, create the window
app.whenReady().then(createWindow);

// Prevent app from quitting when all windows are closed (since we have system tray)
app.on('window-all-closed', (event) => {
  // Prevent default quit behavior
  event.preventDefault();
  console.log('📝 All windows closed, but app continues running in system tray');
  
  // On macOS, keep the app running even when all windows are closed
  // On Windows/Linux, also keep running due to system tray
});

// Handle before quit event
app.on('before-quit', (event) => {
  console.log('🚪 App is about to quit...');
  app.isQuiting = true;
});

app.on('activate', () => {
  // On macOS re-create a window when dock icon is clicked with no other windows open
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindowManager && !mainWindowManager.isDestroyed()) {
    // Show existing window if it exists but is hidden
    mainWindowManager.show();
  }
});