import { BrowserWindow, Notification, app } from 'electron';
import windowStateKeeper from 'electron-window-state';
import serve from 'electron-serve';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if in development or production environment
const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

// In production, serve the built files
const loadURL = serve({
  directory: path.join(__dirname, '../../public/build')
});

class MainWindowManager {
  constructor() {
    this.window = null;
    this.hasShownTrayNotification = false; // Track if we've shown the tray notification
  }

  async create() {
    // Load the previous window state with fallback settings
    let windowState = windowStateKeeper({
      defaultWidth: 1200,
      defaultHeight: 800
    });

    // Get absolute path to preload script
    const preloadPath = path.resolve(__dirname, '../../preload.js');
    console.log('🔧 Preload script path:', preloadPath);

    // Create the browser window
    this.window = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      minWidth: 800,
      minHeight: 600,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath, // Use absolute path
        webSecurity: false
      },
      icon: path.join(__dirname, '../../public/icons/windows11/Square44x44Logo.targetsize-256.png'),
      show: true
    });

    // Register listeners to save the window state
    windowState.manage(this.window);

    console.log('🚀 Creating Electron main window...');
    console.log('📍 Loading URL: http://localhost:8000');

    // Setup window loading
    if (isDev) {
      try {
        await this.window.loadURL('http://localhost:8000');
        console.log('✅ Successfully loaded Laravel server');
        
        this.window.show();
        this.window.focus();
        
        // Enable debugging in development
        this.window.webContents.openDevTools();
        
        // Add error handling
        this.window.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          console.log('❌ Failed to load:', errorDescription, 'URL:', validatedURL);
          if (isDev && validatedURL.includes('localhost:8000')) {
            console.log('🔄 Retrying connection in 2 seconds...');
            setTimeout(() => {
              this.window.loadURL('http://localhost:8000');
            }, 2000);
          }
        });

        this.window.webContents.on('did-finish-load', () => {
          console.log('✅ Page finished loading');
        });
        
      } catch (error) {
        console.error('❌ Failed to load URL:', error);
      }
    } else {
      await loadURL(this.window);
    }
    
    // Handle window close event - minimize to tray instead of closing
    this.window.on('close', (event) => {
      if (!process.env.FORCE_QUIT && !app.isQuiting) {
        event.preventDefault();
        console.log('🔽 Minimizing to system tray...');
        this.window.hide();
        
        // Show notification on first minimize
        if (!this.hasShownTrayNotification) {
          if (Notification.isSupported()) {
            new Notification({
              title: 'Workflow Management',
              body: 'App is running in the background. Click the tray icon to restore.',
              silent: true
            }).show();
          }
          this.hasShownTrayNotification = true;
        }
      } else {
        this.window = null;
      }
    });

    this.window.on('closed', () => {
      this.window = null;
    });

    return this.window;
  }

  getWindow() {
    return this.window;
  }

  isDestroyed() {
    return !this.window || this.window.isDestroyed();
  }

  show() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
      this.window.focus();
    }
  }

  flash() {
    if (this.window && !this.window.isDestroyed() && process.platform === 'win32') {
      this.window.flashFrame(true);
    }
  }

  // Add method to hide window to tray
  hideToTray() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
    }
  }

  // Add method to force close (for when quitting from tray)
  forceClose() {
    if (this.window && !this.window.isDestroyed()) {
      process.env.FORCE_QUIT = true;
      this.window.close();
      this.window = null;
    }
  }
}

export default MainWindowManager;