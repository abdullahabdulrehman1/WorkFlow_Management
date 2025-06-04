import { toast } from 'react-hot-toast';

class DesktopCallService {
    constructor() {
        this.isElectron = typeof window !== 'undefined' && window.electron;
    }

    // Check if running in Electron
    isElectronApp() {
        return this.isElectron;
    }

    // Get CSRF token from meta tag or cookie
    getCsrfToken() {
        // Try to get CSRF token from meta tag first
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) {
            return metaToken;
        }

        // Fallback: try to get from cookie
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }

        return null;
    }

    // Show simple Windows notification - simplified version
    async showSimpleNotification(title, body) {
        if (!this.isElectronApp()) {
            console.log('Not in Electron app, using web toast notification');
            toast.success(`${title}: ${body}`, {
                duration: 10000,
                position: 'top-center',
            });
            return false;
        }

        try {
            console.log('📢 Showing simple Windows notification:', { title, body });
            const result = await window.electron.notifications.showSimple(title, body);
            
            if (result.success) {
                console.log('✅ Windows notification shown successfully');
                return true;
            } else {
                console.error('❌ Failed to show Windows notification:', result.error);
                // Fallback to toast
                toast.error('Failed to show notification: ' + result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error showing Windows notification:', error);
            // Fallback to toast
            toast.error('Error showing notification: ' + error.message);
            return false;
        }
    }

    // Show native Windows notification for incoming call
    async showNativeCallNotification(callData) {
        if (!this.isElectronApp()) {
            console.log('Not in Electron app, using web toast notification');
            toast.success(`📞 Incoming call from ${callData.callerName}`, {
                duration: 10000,
                position: 'top-center',
            });
            return false;
        }

        try {
            console.log('📢 Showing native Windows notification for call:', callData);
            
            // Use simple notification for calls
            const title = callData.callType === 'video' ? '📹 Incoming Video Call' : '📞 Incoming Voice Call';
            const body = `${callData.callerName} is calling you...`;
            
            const result = await this.showSimpleNotification(title, body);
            return result;
        } catch (error) {
            console.error('❌ Error showing native notification:', error);
            // Fallback to toast
            toast.error('Error showing native notification: ' + error.message);
            return false;
        }
    }

    // Open native call window
    async openCallWindow(callData) {
        if (!this.isElectronApp()) {
            toast.error('Desktop calling is only available in the desktop app');
            return false;
        }

        try {
            const result = await window.electron.call.openWindow({
                callId: callData.callId,
                isVideoCall: callData.isVideoCall,
                contactName: callData.contactName,
                callerId: callData.callerId,
                callerName: callData.callerName,
                workflowId: callData.workflowId,
                callStatus: callData.callStatus || 'ringing'
            });
            
            if (result.success) {
                console.log('✅ Call window opened successfully:', result.windowId);
                return true;
            } else {
                console.error('❌ Failed to open call window:', result.error);
                toast.error('Failed to open call window: ' + result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error opening call window:', error);
            toast.error('Error opening call window: ' + error.message);
            return false;
        }
    }

    // Close call window
    async closeCallWindow() {
        if (!this.isElectronApp()) {
            return false;
        }

        try {
            const result = await window.electron.call.closeWindow();
            if (result.success) {
                console.log('✅ Call window closed successfully');
                return true;
            } else {
                console.error('❌ Failed to close call window:', result.error);
                return false;
            }
        } catch (error) {
            console.error('❌ Error closing call window:', error);
            return false;
        }
    }

    // Get call window status
    async getCallWindowStatus() {
        if (!this.isElectronApp()) {
            return { exists: false, isVisible: false };
        }

        try {
            return await window.electron.call.getStatus();
        } catch (error) {
            console.error('❌ Error getting call window status:', error);
            return { exists: false, isVisible: false };
        }
    }

    // Start a desktop call
    async startDesktopCall(workflowId, targetDevices = 'all', callerName = 'Unknown Caller', callType = 'voice') {
        const callData = {
            workflowId,
            targetDevices,
            callerName,
            callType,
            callId: Math.random().toString(36).substring(7),
            timestamp: new Date().toISOString()
        };

        // Get CSRF token
        const csrfToken = this.getCsrfToken();

        // Broadcast call event to all connected devices
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            };

            // Add CSRF token if available
            if (csrfToken) {
                headers['X-CSRF-TOKEN'] = csrfToken;
            }

            const response = await fetch(`/api/workflow/${workflowId}/desktop-call`, {
                method: 'POST',
                headers: headers,
                credentials: 'same-origin', // Include cookies for session
                body: JSON.stringify(callData)
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                
                // Try to get more specific error message
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If we can't parse JSON, use the status text
                    errorMessage = response.statusText || errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            if (result.success) {
                // If we're in Electron, show the notification immediately
                if (this.isElectronApp()) {
                    await this.showNativeCallNotification({
                        ...callData,
                        callerId: 'self' // Mark as self-initiated call
                    });
                }
                
                toast.success('Desktop call initiated successfully!');
                return true;
            } else {
                throw new Error(result.message || 'Failed to initiate desktop call');
            }
        } catch (error) {
            console.error('❌ Error starting desktop call:', error);
            toast.error('Failed to initiate desktop call: ' + error.message);
            return false;
        }
    }
}

// Create singleton instance
const desktopCallService = new DesktopCallService();

export default desktopCallService;