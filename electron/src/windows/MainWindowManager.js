import { BrowserWindow } from 'electron';
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

  close() {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
    }
  }
}

export default MainWindowManager;