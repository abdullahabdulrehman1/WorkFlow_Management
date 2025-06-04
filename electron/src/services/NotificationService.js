import { Notification, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class NotificationService {
  constructor(mainWindowManager, callWindowManager) {
    this.mainWindowManager = mainWindowManager;
    this.callWindowManager = callWindowManager;
    this.activeNotifications = new Map();
    this.setupWindowsOptimizations();
  }

  // Setup Windows-specific optimizations for notifications
  setupWindowsOptimizations() {
    if (process.platform === 'win32') {
      // Set app user model ID for Windows notifications
      app.setAppUserModelId('com.workflow.management.desktop');
    }
  }

  // Check if notifications are supported
  isSupported() {
    return Notification.isSupported();
  }

  // Show native system notification that works even when app is in background
  async showCallNotification(callData) {
    console.log('📢 Showing native call notification:', callData);

    if (!this.isSupported()) {
      console.log('❌ Notifications not supported on this system');
      return false;
    }

    try {
      // Close any existing notifications for this call
      this.closeNotification(callData.callId);

      // Get the correct icon path for the platform
      let iconPath;
      if (process.platform === 'win32') {
        iconPath = path.join(__dirname, '../../public/icons/windows11/Square44x44Logo.targetsize-256.png');
      } else if (process.platform === 'darwin') {
        iconPath = path.join(__dirname, '../../public/icons/ios/icon.icns');
      } else {
        iconPath = path.join(__dirname, '../../public/icons/android/icon.png');
      }

      // Verify icon exists
      if (!fs.existsSync(iconPath)) {
        console.error('❌ Notification icon not found at:', iconPath);
        // Fallback to a default icon
        iconPath = path.join(__dirname, '../../public/logo.png');
      }

      // Create a simple notification first to test
      const notification = new Notification({
        title: callData.isVideoCall ? '📹 Incoming Video Call' : '📞 Incoming Voice Call',
        body: `${callData.contactName || 'Unknown Contact'} is calling you...`,
        icon: iconPath,
        silent: false,
        requireInteraction: true
      });

      // Store notification reference
      this.activeNotifications.set(callData.callId, notification);

      // Handle notification click
      notification.on('click', () => {
        console.log('📞 Notification clicked - answering call');
        this.handleAnswer(callData);
        this.closeNotification(callData.callId);
      });

      // Handle notification close
      notification.on('close', () => {
        console.log('📞 Notification closed');
        this.activeNotifications.delete(callData.callId);
        this.handleDecline(callData);
      });

      // Show the notification
      notification.show();
      console.log('📢 Notification shown successfully');

      // Flash the window
      if (!this.mainWindowManager.isDestroyed()) {
        const mainWindow = this.mainWindowManager.getWindow();
        if (mainWindow) {
          mainWindow.flashFrame(true);
        }
      }

      // Auto-dismiss after 30 seconds if no interaction
      setTimeout(() => {
        if (this.activeNotifications.has(callData.callId)) {
          console.log('📞 Auto-dismissing call notification after timeout');
          this.closeNotification(callData.callId);
          this.handleDecline(callData);
        }
      }, 30000);

      return true;

    } catch (error) {
      console.error('❌ Error showing notification:', error);
      return false;
    }
  }

  // Handle answering the call
  async handleAnswer(callData) {
    console.log('📞 Handling call answer');
    
    // Open call window
    await this.callWindowManager.create({
      ...callData,
      callStatus: 'connected'
    });

    // Bring app to front
    this.mainWindowManager.show();
    this.mainWindowManager.focus();
  }

  // Handle declining the call
  handleDecline(callData) {
    console.log('📞 Handling call decline');
    
    // Close any call windows
    this.callWindowManager.close();
    
    // Stop flashing
    if (!this.mainWindowManager.isDestroyed()) {
      const mainWindow = this.mainWindowManager.getWindow();
      if (mainWindow) {
        mainWindow.flashFrame(false);
      }
    }
  }

  // Close specific notification
  closeNotification(callId) {
    const notification = this.activeNotifications.get(callId);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(callId);
    }
  }

  // Close all active call notifications
  closeAllNotifications() {
    this.activeNotifications.forEach((notification, callId) => {
      notification.close();
    });
    this.activeNotifications.clear();
  }
}

export default NotificationService;