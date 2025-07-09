import { Capacitor } from '@capacitor/core';
import { CallPlugin } from './iOSSimpleCall'; // Import the singleton instance

/**
 * iOS Call Service - Simple utility to interface with native iOS CallKit
 * This service provides easy methods to trigger native iOS call screens
 */
class IOSCallService {
    constructor() {
        this.isIOS = Capacitor.getPlatform() === 'ios';
        this.callKitPlugin = null;
        
        console.log('🔍 IOSCallService: Initializing with detailed debugging...', {
            platform: Capacitor.getPlatform(),
            isNative: Capacitor.isNativePlatform(),
            isIOS: this.isIOS,
            capacitorVersion: Capacitor.getPlatform(),
            availablePlugins: Object.keys(Capacitor.Plugins || {})
        });
        
        if (this.isIOS && Capacitor.isNativePlatform()) {
            this.initializePlugin();
        } else {
            console.log('❌ Not on iOS native platform, CallKit not available');
        }
    }
    
    initializePlugin() {
        if (CallPlugin) {
            this.callKitPlugin = CallPlugin;
            console.log('✅ CallPlugin initialized from singleton instance');
                    } else {
            console.error('❌ CallPlugin singleton instance not found!');
        }
    }

    /**
     * Test plugin connectivity with enhanced debugging
     */
    async testPluginConnection() {
        console.log('🧪 Testing plugin connection with enhanced debugging...');
        
        if (!this.callKitPlugin) {
            console.error('❌ CallPlugin not available for testing');
            throw new Error('CallPlugin not available');
        }
        
        try {
            console.log('🧪 Calling testPlugin method...');
            const result = await this.callKitPlugin.testPlugin();
            console.log('✅ Plugin test successful:', result);
            return result;
        } catch (error) {
            console.error('❌ Plugin test failed:', error);
            
            // Try alternative method names
            try {
                console.log('🧪 Trying alternative method call...');
                if (typeof this.callKitPlugin.testPlugin === 'function') {
                    const result = await this.callKitPlugin.testPlugin({});
                    console.log('✅ Alternative method successful:', result);
                    return result;
                }
            } catch (altError) {
                console.error('❌ Alternative method failed:', altError);
            }
            
            throw error;
        }
    }

    /**
     * Enhanced debugging method
     */
    async getDebugInfo() {
        const info = {
            platform: Capacitor.getPlatform(),
            isNative: Capacitor.isNativePlatform(),
            isIOS: this.isIOS,
            pluginAvailable: !!this.callKitPlugin,
            pluginType: typeof this.callKitPlugin,
            availablePlugins: Object.keys(Capacitor.Plugins || {}),
            capacitorInfo: {
                version: Capacitor.getPlatform(),
                nativeWebView: Capacitor.isNativePlatform()
            }
        };
        
        // Try to test plugin connection if available
        if (this.callKitPlugin) {
            try {
                info.pluginTest = await this.testPluginConnection();
            } catch (error) {
                info.pluginTest = { error: error.message };
            }
        }
        
        console.log('🔍 Complete Debug Info:', info);
        return info;
    }

    /**
     * Check if iOS CallKit is available
     */
    isAvailable() {
        const available = this.isIOS && Capacitor.isNativePlatform() && !!this.callKitPlugin;
        console.log('🔍 CallKit available check:', {
            isIOS: this.isIOS,
            isNative: Capacitor.isNativePlatform(),
            hasPlugin: !!this.callKitPlugin,
            pluginType: typeof this.callKitPlugin,
            result: available
        });
        return available;
    }

    /**
     * Show test call screen with enhanced error handling
     */
    async testCallScreen() {
        console.log('📞 testCallScreen called');
        
        if (!this.isAvailable()) {
            const debugInfo = await this.getDebugInfo();
            console.error('❌ CallKit not available. Debug info:', debugInfo);
            throw new Error(`CallKit not available. Platform: ${Capacitor.getPlatform()}, Native: ${Capacitor.isNativePlatform()}, Plugin: ${!!this.callKitPlugin}`);
        }

        // First test plugin connection
        try {
            await this.testPluginConnection();
        } catch (error) {
            console.error('❌ Plugin connection test failed:', error);
            throw new Error(`Plugin connection failed: ${error.message}`);
        }

        try {
            console.log('📞 Attempting to show incoming call screen...');
            
            const result = await this.callKitPlugin.reportIncomingCall({
                callerName: "Test Contact",
                callerNumber: "+1234567890"
            });
            
            console.log('✅ Call screen shown successfully:', result);
            return true;
            
        } catch (error) {
            console.error('❌ Error showing call screen:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
                code: error.code
            });
            throw error;
        }
    }

    /**
     * Show outgoing call screen
     */
    async showOutgoingCall(phoneNumber = "+1234567890", contactName = "Test Contact") {
        console.log('📞 showOutgoingCall called', { phoneNumber, contactName });
        
        if (!this.isAvailable()) {
            console.error('❌ CallKit not available for outgoing call');
            throw new Error('CallKit not available');
        }

        try {
            console.log('📞 Attempting to start outgoing call...');
            
            const result = await this.callKitPlugin.startOutgoingCall({
                phoneNumber,
                contactName
            });
            
            console.log('✅ Outgoing call started successfully:', result);
            return true;
            
        } catch (error) {
            console.error('❌ Error starting outgoing call:', error);
            throw error;
        }
    }
}

// Export singleton instance
const iosCallService = new IOSCallService();
export default iosCallService; 