import { app, BrowserWindow, ipcMain } from 'electron';
import serve from 'electron-serve';
import path from 'path';
import { fileURLToPath } from 'url';
import windowStateKeeper from 'electron-window-state';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if in development or production environment
const isDev = !app.isPackaged;

// In production, serve the built files
const loadURL = serve({
  directory: path.join(__dirname, '../public/build')
});

// Keep a global reference of the window object
let mainWindow;

const createWindow = async () => {
  // Load the previous window state with fallback settings
  let windowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 800
  });

  // Create the browser window
  mainWindow = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true, // Hide the menu bar (File, Edit, View, etc.)
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Disable web security for development
    },
    icon: path.join(__dirname, '../public/icons/windows11/Square44x44Logo.targetsize-256.png'),
    show: true // Show window immediately
  });

  // Register listeners to save the window state
  windowState.manage(mainWindow);

  // Add debugging
  console.log('🚀 Creating Electron window...');
  console.log('📍 Loading URL: http://localhost:8000');

  // Setup window loading
  if (isDev) {
    try {
      // In development, connect to Laravel server
      await mainWindow.loadURL('http://localhost:8000');
      console.log('✅ Successfully loaded Laravel server');
      
      // Force show the window
      mainWindow.show();
      mainWindow.focus();
      
    } catch (error) {
      console.error('❌ Failed to load URL:', error);
    }
    
    // Enable debugging in development
    mainWindow.webContents.openDevTools();
    
    // Add more detailed error handling
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.log('❌ Failed to load:', errorDescription, 'URL:', validatedURL);
      if (isDev && validatedURL.includes('localhost:8000')) {
        console.log('🔄 Retrying connection in 2 seconds...');
        setTimeout(() => {
          mainWindow.loadURL('http://localhost:8000');
        }, 2000);
      }
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('✅ Page finished loading');
    });
    
  } else {
    // In production, load the built app
    await loadURL(mainWindow);
  }
  
  // Remove the ready-to-show handler since we're showing immediately
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

// Handle IPC events from the renderer process
ipcMain.on('app-info', (event) => {
  event.sender.send('app-info-reply', {
    appName: app.getName(),
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    platform: process.platform,
    arch: process.arch
  });
});