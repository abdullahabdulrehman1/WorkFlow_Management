import { ipcMain } from 'electron';

class IPCHandler {
  constructor(mainWindowManager, callWindowManager, notificationService) {
    this.mainWindowManager = mainWindowManager;
    this.callWindowManager = callWindowManager;
    this.notificationService = notificationService;
    this.setupHandlers();
  }

  setupHandlers() {
    // App info handler
    ipcMain.on('app-info', (event) => {
      event.sender.send('app-info-reply', {
        appName: require('electron').app.getName(),
        appVersion: require('electron').app.getVersion(),
        electronVersion: process.versions.electron,
        platform: process.platform,
        arch: process.arch
      });
    });

    // Call window handlers
    ipcMain.handle('open-call-window', async (event, callData) => {
      try {
        console.log('📞 IPC: Opening call window with data:', callData);
        const window = await this.callWindowManager.create(callData);
        return { success: true, windowId: window.id };
      } catch (error) {
        console.error('❌ Error creating call window:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('close-call-window', async (event) => {
      try {
        const closed = this.callWindowManager.close();
        // Clear notification badge when call is closed
        this.notificationService.clearBadge();
        return { success: closed };
      } catch (error) {
        console.error('❌ Error closing call window:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-call-window-status', async (event) => {
      return this.callWindowManager.getStatus();
    });

    // Native notification handler
    ipcMain.handle('show-native-notification', async (event, callData) => {
      try {
        console.log('📞 IPC: Showing native notification for call:', callData);
        const success = await this.notificationService.showCallNotification(callData);
        return { success };
      } catch (error) {
        console.error('❌ Error showing native notification:', error);
        return { success: false, error: error.message };
      }
    });

    // Toast notification handler
    ipcMain.handle('show-toast-notification', async (event, title, body, options = {}) => {
      try {
        const success = this.notificationService.showToastNotification(title, body, options);
        return { success };
      } catch (error) {
        console.error('❌ Error showing toast notification:', error);
        return { success: false, error: error.message };
      }
    });

    // Clear notification badge
    ipcMain.handle('clear-notification-badge', async (event) => {
      try {
        this.notificationService.clearBadge();
        return { success: true };
      } catch (error) {
        console.error('❌ Error clearing notification badge:', error);
        return { success: false, error: error.message };
      }
    });

    // Close specific notification
    ipcMain.handle('close-notification', async (event, callId) => {
      try {
        this.notificationService.closeNotification(callId);
        return { success: true };
      } catch (error) {
        console.error('❌ Error closing notification:', error);
        return { success: false, error: error.message };
      }
    });

    // Main window handlers
    ipcMain.handle('show-main-window', async (event) => {
      try {
        this.mainWindowManager.show();
        return { success: true };
      } catch (error) {
        console.error('❌ Error showing main window:', error);
        return { success: false, error: error.message };
      }
    });

    // Background call notification handler - this is the key one for background notifications
    ipcMain.handle('handle-incoming-call', async (event, callData) => {
      try {
        console.log('📞 IPC: Handling incoming call in background:', callData);
        
        // Show native notification first (works even in background)
        const notificationSuccess = await this.notificationService.showCallNotification(callData);
        
        // Optionally also create call window immediately
        let windowSuccess = false;
        if (callData.autoOpenWindow !== false) {
          try {
            await this.callWindowManager.create({
              ...callData,
              callStatus: 'ringing'
            });
            windowSuccess = true;
          } catch (windowError) {
            console.log('⚠️ Could not create call window, but notification was shown');
          }
        }

        return { 
          success: notificationSuccess || windowSuccess,
          notificationShown: notificationSuccess,
          windowOpened: windowSuccess
        };
      } catch (error) {
        console.error('❌ Error handling incoming call:', error);
        return { success: false, error: error.message };
      }
    });

    console.log('✅ IPC handlers registered successfully');
  }
}

export default IPCHandler;