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
    this.setupSoundPaths();
  }

  // Setup Windows-specific optimizations for notifications
  setupWindowsOptimizations() {
    if (process.platform === 'win32') {
      // Set app user model ID for Windows notifications
      app.setAppUserModelId('com.workflow.management.desktop');
    }
  }

  // Setup sound file paths
  setupSoundPaths() {
    this.soundPaths = {
      callRingtone: path.join(__dirname, '../../public/sounds/test.mp3'),
      notificationSound: path.join(__dirname, '../../public/sounds/test.mp3')
    };
    
    // Verify sound files exist
    Object.entries(this.soundPaths).forEach(([name, soundPath]) => {
      if (fs.existsSync(soundPath)) {
        console.log(`🔊 Found sound file for ${name}:`, soundPath);
      } else {
        console.warn(`⚠️ Sound file not found for ${name}:`, soundPath);
      }
    });
  }

  // Check if notifications are supported
  isSupported() {
    return Notification.isSupported();
  }

  // Play sound file
  async playSound(soundType = 'callRingtone') {
    try {
      const soundPath = this.soundPaths[soundType];
      if (!soundPath || !fs.existsSync(soundPath)) {
        console.warn(`⚠️ Sound file not found for ${soundType} at path: ${soundPath}`);
        return false;
      }

      console.log(`🔊 NotificationService.playSound called:`, {
        soundType,
        soundPath,
        mainWindowExists: !this.mainWindowManager.isDestroyed()
      });
      
      // Send sound play request to renderer process
      if (!this.mainWindowManager.isDestroyed()) {
        const window = this.mainWindowManager.getWindow();
        if (window) {
          // Convert absolute path to relative URL for the renderer
          const relativeSoundPath = path.relative(
            path.join(__dirname, '../../public'),
            soundPath
          ).replace(/\\/g, '/');
          
          console.log(`🎵 Sending play-sound IPC message:`, {
            soundPath: relativeSoundPath,
            soundType: soundType,
            loop: soundType === 'callRingtone'
          });
          
          window.webContents.send('play-sound', {
            soundPath: relativeSoundPath,
            soundType: soundType,
            loop: soundType === 'callRingtone' // Loop ringtone until call is answered/declined
          });
          
          console.log(`✅ Play-sound IPC message sent successfully`);
          return true;
        } else {
          console.warn(`⚠️ Main window not available for sound playback`);
        }
      } else {
        console.warn(`⚠️ Main window manager is destroyed, cannot play sound`);
      }
      return false;
    } catch (error) {
      console.error('❌ Error playing sound:', error);
      return false;
    }
  }

  // Stop sound playback
  async stopSound(soundType = 'callRingtone') {
    try {
      if (!this.mainWindowManager.isDestroyed()) {
        const window = this.mainWindowManager.getWindow();
        if (window) {
          window.webContents.send('stop-sound', { soundType });
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('❌ Error stopping sound:', error);
      return false;
    }
  }

  // Show native system notification that works even when app is in background
  async showCallNotification(callData) {
    console.log('📢 Showing native call notification:', callData);
    console.log('🔊 Debug: Incoming call event triggered');

    if (!this.isSupported()) {
      console.log('❌ Notifications not supported on this system');
      return false;
    }

    try {
      // Close any existing notifications for this call
      this.closeNotification(callData.callId);

      // Play call ringtone sound
      console.log('🔊 Debug: Calling playSound for incoming call');
      await this.playSound('callRingtone');
      console.log('🔊 Debug: playSound called for incoming call');

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
        silent: true, // Set to true to prevent browser notification
        requireInteraction: true
      });

      // Store notification reference
      this.activeNotifications.set(callData.callId, notification);

      // Handle notification click
      notification.on('click', () => {
        console.log('📞 Notification clicked - answering call');
        this.stopSound('callRingtone'); // Stop ringtone
        this.handleAnswer(callData);
        this.closeNotification(callData.callId);
      });

      // Handle notification close
      notification.on('close', () => {
        console.log('📞 Notification closed');
        this.stopSound('callRingtone'); // Stop ringtone
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
          this.stopSound('callRingtone'); // Stop ringtone
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
    
    // Stop ringtone sound
    await this.stopSound('callRingtone');
    
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
    
    // Stop ringtone sound
    this.stopSound('callRingtone');
    
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
      // Stop sound when closing notification
      this.stopSound('callRingtone');
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

  // Show simple toast notification - this is the missing method
  async showToastNotification(title, body, options = {}) {
    console.log('📢 Showing toast notification:', { title, body, options });

    if (!this.isSupported()) {
      console.log('❌ Notifications not supported on this system');
      return false;
    }

    try {
      // Get the correct icon path
      let iconPath = path.join(__dirname, '../../public/logo.png');
      
      // Create simple notification
      const notification = new Notification({
        title: title || 'Notification',
        body: body || '',
        icon: iconPath,
        silent: options.silent || false,
        ...options
      });

      // Handle notification click
      notification.on('click', () => {
        console.log('📢 Toast notification clicked');
        this.mainWindowManager.show();
        notification.close();
      });

      // Show the notification
      notification.show();
      console.log('✅ Toast notification shown successfully');

      return true;
    } catch (error) {
      console.error('❌ Error showing toast notification:', error);
      return false;
    }
  }

  // Clear notification badge (for compatibility)
  clearBadge() {
    console.log('📢 Clearing notification badge');
    // On Windows, we can stop flashing the window
    if (process.platform === 'win32' && !this.mainWindowManager.isDestroyed()) {
      const mainWindow = this.mainWindowManager.getWindow();
      if (mainWindow) {
        mainWindow.flashFrame(false);
      }
    }
  }
}

export default NotificationService;