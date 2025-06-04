// Simple Windows notification utility for Electron
export const WindowsNotificationUtil = {
    // Check if we're running in Electron
    isElectronApp() {
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        // Clear console log for environment detection
        if (isElectron) {
            console.log('🖥️ YOU ARE RUNNING IN ELECTRON');
            console.log('🔧 Available Electron APIs:', Object.keys(window.electron));
        } else {
            console.log('🌐 YOU ARE RUNNING ON WEB');
        }
        
        return isElectron;
    },

    // Simple method to check environment (call this from console)
    checkEnvironment() {
        return this.isElectronApp();
    },

    // Show a simple Windows notification
    async showNotification(title, body, options = {}) {
        if (!this.isElectronApp()) {
            console.log('❌ Not running in Electron - using fallback');
            return this.showFallbackNotification(title, body);
        }

        try {
            console.log('📢 Sending notification via Electron IPC:', { title, body });
            const result = await window.electron.notifications.showSimple(title, body);
            console.log('✅ Electron notification result:', result);
            return result.success;
        } catch (error) {
            console.error('❌ Error showing Windows notification:', error);
            return this.showFallbackNotification(title, body);
        }
    },

    // Fallback to browser notification
    showFallbackNotification(title, body) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/logo.png' });
            return true;
        } else if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body, icon: '/logo.png' });
                }
            });
        }
        return false;
    },

    // Show workflow save notification
    async showWorkflowSaved(workflowName) {
        return await this.showNotification(
            '✅ Workflow Saved',
            `Your workflow "${workflowName}" has been saved successfully!`
        );
    },

    // Show call notification
    async showIncomingCall(callerName, callType = 'voice') {
        const title = callType === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call';
        const body = `${callerName} is calling you...`;
        return await this.showNotification(title, body);
    },

    // Show general success notification
    async showSuccess(message) {
        return await this.showNotification('✅ Success', message);
    },

    // Show error notification
    async showError(message) {
        return await this.showNotification('❌ Error', message);
    }
};

// Make it globally available for testing
if (typeof window !== 'undefined') {
    window.WindowsNotificationUtil = WindowsNotificationUtil;
    
    // Auto-check environment on load
    console.log('🔍 Environment Check:');
    WindowsNotificationUtil.checkEnvironment();
}