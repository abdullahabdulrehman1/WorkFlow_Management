import { Capacitor, registerPlugin } from '@capacitor/core';

// Try auto-discovery first
let CallPlugin = Capacitor.Plugins.CallPlugin;

// If auto-discovery doesn't work, try manual registration
if (!CallPlugin) {
    console.log('🔄 Auto-discovery failed, trying manual registration...');
    CallPlugin = registerPlugin('CallPlugin');
}

// Export with logging for debugging
export { CallPlugin };

// Add debugging
console.log('📱 CallPlugin setup:', {
    autoDiscoveryAvailable: !!Capacitor.Plugins.CallPlugin,
    finalPluginAvailable: !!CallPlugin,
    platform: Capacitor.getPlatform(),
    isNative: Capacitor.isNativePlatform()
});

export async function handleCallButtonClick() {
    console.log('📞 Call button clicked - showing WhatsApp-style notification...');
    
    try {
        // Check if we're on iOS
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
            console.log('🌐 Not on native platform, skipping call');
            return;
        }
        
        console.log('📱 Platform check passed - running on iOS native');
        
        // Check available plugins
        const availablePlugins = Object.keys(window.Capacitor.Plugins);
        console.log('🔍 Available plugins:', availablePlugins);
        
        // Try using LocalNotifications plugin which is already working
        const localNotifications = window.Capacitor.Plugins.LocalNotifications;
        if (localNotifications) {
            console.log('📞 Using LocalNotifications plugin for call notification...');
            
            // First, request permissions
            const permResult = await localNotifications.requestPermissions();
            console.log('📞 Notification permissions:', permResult);
            
            // Schedule a call notification
            const notificationId = Date.now();
            await localNotifications.schedule({
                notifications: [
                    {
                        title: "Incoming Call",
                        body: "Mac Device (Desktop) is calling...",
                        id: notificationId,
                        schedule: { at: new Date(Date.now() + 1000) }, // Show in 1 second
                        sound: 'default',
                        attachments: [],
                        actionTypeId: 'CALL_ACTIONS',
                        extra: {
                            callerName: 'Mac Device (Desktop)',
                            callerId: 'desktop_001',
                            type: 'incoming_call'
                        }
                    }
                ]
            });
            
            console.log('✅ Call notification scheduled successfully');
            return;
        }
        
        // Fallback: Check if CallPlugin is available
        const callPluginAvailable = !!window.Capacitor.Plugins.CallPlugin;
        console.log('🔍 CallPlugin available:', callPluginAvailable);
        
        if (!callPluginAvailable) {
            console.log('❌ Neither LocalNotifications nor CallPlugin available');
            return;
        }
        
        // Debug the plugin object
        const callPlugin = window.Capacitor.Plugins.CallPlugin;
        console.log('🔍 CallPlugin object:', callPlugin);
        console.log('🔍 CallPlugin methods:', Object.keys(callPlugin));
        
        console.log('📞 Calling CallPlugin.showCallNotification()...');
        
        // Call the new notification method
        const result = await callPlugin.showCallNotification({
            callerName: 'Mac Device (Desktop)',
            callerId: 'desktop_001'
        });
        
        console.log('✅ Call notification shown successfully:', result);
        
    } catch (error) {
        console.error('❌ Error in handleCallButtonClick:', error);
        
        // Try alternative methods for debugging
        console.log('🔄 Trying alternative calling method...');
        try {
            const { Capacitor } = await import('@capacitor/core');
            console.log('📦 Imported Capacitor:', !!Capacitor);
            
            console.log('📞 Trying with imported Capacitor...');
            const result = await Capacitor.Plugins.CallPlugin.showCallNotification({
                callerName: 'Mac Device (Desktop)',
                callerId: 'desktop_001'
            });
            console.log('✅ Alternative method worked:', result);
            
        } catch (altError) {
            console.error('❌ Alternative method also failed:', altError);
            
            // Try direct plugin access
            console.log('🔄 Trying direct plugin access...');
            try {
                const direct = window.Capacitor.Plugins.CallPlugin;
                console.log('📞 Direct plugin object:', direct);
                const directResult = await direct.showCallNotification({
                    callerName: 'Mac Device (Desktop)',
                    callerId: 'desktop_001'
                });
                console.log('✅ Direct access worked:', directResult);
            } catch (directError) {
                console.error('❌ Direct access failed:', directError);
            }
        }
    }
} 