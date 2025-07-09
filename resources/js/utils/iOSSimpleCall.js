import { Capacitor, registerPlugin } from '@capacitor/core';

/**
 * Centralized CallPlugin manager for iOS CallKit integration
 * This ensures consistent plugin registration across the app
 */
class CallPluginManager {
    constructor() {
        this.plugin = null;
        this.isInitialized = false;
        this.initializePlugin();
    }

    initializePlugin() {
        try {
            const platform = Capacitor.getPlatform();
            const isNative = Capacitor.isNativePlatform();
            
            console.log('📞 [CallPluginManager] Initializing for platform:', platform, 'Native:', isNative);
            
            if (!isNative) {
                console.log('📞 [CallPluginManager] Not on native platform, using web fallback');
                this.plugin = this.createWebFallback();
                this.isInitialized = true;
                return;
            }

            // For native platforms, try to get the CallPlugin
            if (platform === 'ios') {
                // Try auto-discovery first
                if (Capacitor.Plugins && Capacitor.Plugins.CallPlugin) {
                    console.log('📞 [CallPluginManager] ✅ Found CallPlugin via auto-discovery');
                    this.plugin = Capacitor.Plugins.CallPlugin;
                    this.isInitialized = true;
                    return;
                }

                // Try manual registration
                try {
                    console.log('📞 [CallPluginManager] Attempting manual registration...');
                    this.plugin = registerPlugin('CallPlugin');
                    console.log('📞 [CallPluginManager] ✅ CallPlugin registered successfully');
                    this.isInitialized = true;
                    return;
                } catch (error) {
                    console.error('📞 [CallPluginManager] ❌ Manual registration failed:', error);
                }
            }

            // Fallback for any issues
            console.log('📞 [CallPluginManager] Using web fallback due to registration issues');
            this.plugin = this.createWebFallback();
            this.isInitialized = true;

        } catch (error) {
            console.error('📞 [CallPluginManager] ❌ Initialization failed:', error);
            this.plugin = this.createWebFallback();
            this.isInitialized = true;
        }
    }

    createWebFallback() {
        return {
            startCall: async (options) => {
                console.log('📞 [CallPluginManager] ⚠️ Web fallback startCall called with:', options);
                
                // Add platform and availability info
                const debugInfo = {
                    platform: Capacitor.getPlatform(),
                    isNative: Capacitor.isNativePlatform(),
                    options: options,
                    timestamp: new Date().toISOString()
                };
                
                console.log('📞 [CallPluginManager] Web fallback debug info:', debugInfo);
                
                // Return a promise that resolves like the native plugin would
                return {
                    success: true,
                    callId: Date.now().toString(),
                    platform: 'web-fallback',
                    message: 'Web fallback used - native CallKit not available',
                    debugInfo: debugInfo
                };
            },
            endCall: async () => {
                console.log('📞 [CallPluginManager] Web fallback endCall called');
                return { success: true, platform: 'web-fallback' };
            },
            reportIncomingCall: async (options) => {
                console.log('📞 [CallPluginManager] Web fallback reportIncomingCall called with:', options);
                return {
                    success: true,
                    callId: Date.now().toString(),
                    platform: 'web-fallback',
                    message: 'Web fallback used - native CallKit not available'
                };
            }
        };
    }

    getPlugin() {
        if (!this.isInitialized) {
            console.warn('📞 [CallPluginManager] Plugin not initialized yet');
            return this.createWebFallback();
        }
        
        // If we have a native plugin, wrap it with logging
        if (this.isNativeCallKit()) {
            console.log('📞 [CallPluginManager] ✅ Returning native iOS CallKit plugin');
            
            return {
                startCall: async (options) => {
                    console.log('📞 [CallPluginManager] 🎉 NATIVE startCall called with:', options);
                    try {
                        const result = await this.plugin.startCall(options);
                        console.log('📞 [CallPluginManager] ✅ NATIVE startCall result:', result);
                        return result;
                    } catch (error) {
                        console.error('📞 [CallPluginManager] ❌ NATIVE startCall error:', error);
                        throw error;
                    }
                },
                endCall: async () => {
                    console.log('📞 [CallPluginManager] 🎉 NATIVE endCall called');
                    try {
                        const result = await this.plugin.endCall();
                        console.log('📞 [CallPluginManager] ✅ NATIVE endCall result:', result);
                        return result;
                    } catch (error) {
                        console.error('📞 [CallPluginManager] ❌ NATIVE endCall error:', error);
                        throw error;
                    }
                },
                reportIncomingCall: async (options) => {
                    console.log('📞 [CallPluginManager] 🎉 NATIVE reportIncomingCall called with:', options);
                    try {
                        const result = await this.plugin.reportIncomingCall(options);
                        console.log('📞 [CallPluginManager] ✅ NATIVE reportIncomingCall result:', result);
                        return result;
                    } catch (error) {
                        console.error('📞 [CallPluginManager] ❌ NATIVE reportIncomingCall error:', error);
                        throw error;
                    }
                }
            };
        }
        
        console.log('📞 [CallPluginManager] ⚠️ Returning web fallback plugin');
        return this.plugin;
    }

    isAvailable() {
        return this.isInitialized && this.plugin !== null;
    }

    isNativeCallKit() {
        return Capacitor.isNativePlatform() && 
               Capacitor.getPlatform() === 'ios' && 
               this.plugin !== null && 
               typeof this.plugin.startCall === 'function';
    }
}

// Create and export singleton instance
const callPluginManager = new CallPluginManager();

// Export the plugin instance for backward compatibility
export const CallPlugin = callPluginManager.getPlugin();

// Export the manager for advanced usage
export { callPluginManager };

// Export convenience functions
export async function handleCallButtonClick() {
    try {
        const plugin = callPluginManager.getPlugin();
        
        if (callPluginManager.isNativeCallKit()) {
            console.log('📞 [handleCallButtonClick] Using native iOS CallKit');
            
            const result = await plugin.startCall({
                callerId: 'test-user-123',
                callerName: 'Test Caller',
                callType: 'audio'
            });
            
            console.log('📞 [handleCallButtonClick] Native CallKit result:', result);
            return result;
        } else {
            console.log('📞 [handleCallButtonClick] Using web fallback');
            const result = await plugin.startCall({
                callerId: 'test-user-123',
                callerName: 'Test Caller',
                callType: 'audio'
            });
            console.log('📞 [handleCallButtonClick] Web fallback result:', result);
            return result;
        }
    } catch (error) {
        console.error('📞 [handleCallButtonClick] Error:', error);
        throw error;
    }
} 