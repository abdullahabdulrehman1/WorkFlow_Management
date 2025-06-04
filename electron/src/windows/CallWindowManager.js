import { BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CallWindowManager {
  constructor() {
    this.window = null;
  }

  async create(callData) {
    console.log('📞 Creating call window with data:', callData);
    
    // If call window already exists, close it first
    if (this.window && !this.window.isDestroyed()) {
      console.log('🔄 Closing existing call window');
      this.window.close();
      this.window = null;
    }

    // Create the call window
    this.window = new BrowserWindow({
      width: 400,
      height: 650,
      minWidth: 350,
      minHeight: 600,
      maxWidth: 500,
      maxHeight: 800,
      autoHideMenuBar: true,
      alwaysOnTop: true,
      resizable: true,
      show: false,
      skipTaskbar: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload.js'),
        webSecurity: false
      },
      icon: path.join(__dirname, '../../public/icons/windows11/Square44x44Logo.targetsize-256.png'),
      frame: true,
      transparent: false,
      backgroundColor: '#1f2937',
      title: `Call - ${callData.contactName || 'Unknown'}`
    });

    // Generate call screen HTML
    const callScreenHTML = this.generateCallScreenHTML(callData);

    // Load the HTML content
    await this.window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(callScreenHTML)}`);

    // Show window when ready
    this.window.once('ready-to-show', () => {
      console.log('📞 Call window ready to show');
      this.window.show();
      this.window.focus();
      
      // Flash the window to get attention
      if (process.platform === 'win32') {
        this.window.flashFrame(true);
      }
    });

    // Handle window closed
    this.window.on('closed', () => {
      console.log('📞 Call window closed');
      this.window = null;
    });

    return this.window;
  }

  generateCallScreenHTML(callData) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Call Screen</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
              body {
                  margin: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  overflow: hidden;
              }
          </style>
      </head>
      <body>
          <div id="call-screen" class="h-screen w-full bg-gradient-to-br from-green-400 via-green-500 to-green-600 flex flex-col relative overflow-hidden">
              <!-- Header - Contact info -->
              <div class="relative z-20 pt-12 pb-8 text-center text-white">
                  <div class="flex flex-col items-center">
                      <!-- Avatar -->
                      <div class="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-4">
                          <span class="text-5xl font-bold text-white">
                              ${(callData.contactName || 'U').charAt(0).toUpperCase()}
                          </span>
                      </div>
                      
                      <h1 class="text-2xl font-semibold mb-1">${callData.contactName || 'Unknown Contact'}</h1>
                      ${callData.contactNumber ? `<p class="text-sm text-white text-opacity-80 mb-2">${callData.contactNumber}</p>` : ''}
                      <p class="text-lg text-white text-opacity-90" id="call-status">${callData.callStatus === 'ringing' ? 'Incoming call...' : 'Connecting...'}</p>
                  </div>
              </div>

              <!-- Spacer to push controls to bottom -->
              <div class="flex-1"></div>

              <!-- Call controls -->
              <div class="relative z-20 pb-12 px-8">
                  <div class="flex justify-center items-center space-x-8">
                      ${callData.callStatus === 'ringing' ? this.getIncomingCallButtons() : this.getActiveCallButtons()}
                  </div>
              </div>
          </div>

          <script>
              console.log('📞 Call screen loaded with data:', ${JSON.stringify(callData)});
              
              // Handle button clicks
              document.getElementById('end-call')?.addEventListener('click', () => {
                  console.log('📞 End call clicked');
                  if (window.electron && window.electron.call) {
                      window.electron.call.closeWindow();
                  } else {
                      window.close();
                  }
              });

              document.getElementById('accept-call')?.addEventListener('click', () => {
                  console.log('📞 Accept call clicked');
                  document.getElementById('call-status').textContent = 'Connected';
                  
                  // Replace buttons with active call controls
                  const controlsContainer = document.querySelector('.space-x-8');
                  if (controlsContainer) {
                      controlsContainer.innerHTML = \`${this.getActiveCallButtons().replace(/\\/g, '\\\\')}\`;
                      
                      // Re-bind end call event
                      document.getElementById('end-call').addEventListener('click', () => {
                          console.log('📞 End call clicked');
                          if (window.electron && window.electron.call) {
                              window.electron.call.closeWindow();
                          } else {
                              window.close();
                          }
                      });
                  }
              });
          </script>
      </body>
      </html>
    `;
  }

  getIncomingCallButtons() {
    return `
      <button
          id="accept-call"
          class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-all duration-200 shadow-lg"
          title="Accept call"
      >
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
      </button>
      <button
          id="end-call"
          class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg"
          title="End call"
      >
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M6.5 6.5l1.5 1.5m0 0L10.5 10M8 8l1.5 1.5M3 21h18"></path>
          </svg>
      </button>
    `;
  }

  getActiveCallButtons() {
    return `
      <button
          id="mute-call"
          class="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 bg-white bg-opacity-20 hover:bg-opacity-30"
          title="Mute"
      >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
          </svg>
      </button>
      <button
          id="end-call"
          class="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg"
          title="End call"
      >
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M6.5 6.5l1.5 1.5m0 0L10.5 10M8 8l1.5 1.5M3 21h18"></path>
          </svg>
      </button>
      <button
          id="speaker-call"
          class="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 bg-white bg-opacity-20 hover:bg-opacity-30"
          title="Speaker"
      >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M12 6.6V17.4c0 .33-.132.647-.366.88L9.5 20H6a1 1 0 01-1-1v-6a1 1 0 011-1h3.5l2.134-1.72c.234-.233.366-.55.366-.88z"></path>
          </svg>
      </button>
    `;
  }

  getWindow() {
    return this.window;
  }

  isDestroyed() {
    return !this.window || this.window.isDestroyed();
  }

  close() {
    if (this.window && !this.window.isDestroyed()) {
      console.log('📞 Closing call window');
      this.window.close();
      this.window = null;
      return true;
    }
    return false;
  }

  getStatus() {
    return {
      exists: this.window && !this.window.isDestroyed(),
      isVisible: this.window && !this.window.isDestroyed() && this.window.isVisible()
    };
  }
}

export default CallWindowManager;