import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { subscribeToPush } from './services/pushService';
import { isLocalhost, isMobileDevice } from './utils/notificationUtils';

// React component that initializes push notifications
const PushManager = () => {
    const [isLocalhostEnv, setIsLocalhostEnv] = useState(false);
    
    useEffect(() => {
        // Check if running on localhost
        setIsLocalhostEnv(isLocalhost());
        
        const initPushNotifications = async () => {
            // Don't run in iframes
            if (window.self !== window.top) return;
            
            try {
                // Wait a moment for page to load fully
                setTimeout(async () => {
                    const result = await subscribeToPush();
                    
                    if (result.isLocalDevelopment) {
                        console.log('Running in local development mode - mock push subscription created');
                    } else if (!result.success) {
                        console.log('Push notifications not enabled:', result.reason);
                        
                        // Only show permission errors to user
                        if (result.reason === 'permission-denied') {
                            toast.error('Please enable notifications for workflow alerts');
                        }
                    }
                }, 2000);

                // For mobile apps, request notification permissions if needed
                if (isMobileDevice()) {
                    if ('Notification' in window) {
                        Notification.requestPermission();
                    }
                }
            } catch (error) {
                console.error('Error initializing push notifications:', error);
            }
        };
        
        initPushNotifications();
    }, []);
    
    // Show a small indicator during local development
    if (isLocalhostEnv && process.env.NODE_ENV === 'development') {
        return (
            <div style={{
                position: 'fixed',
                bottom: 10, 
                right: 10, 
                background: 'rgba(0,0,0,0.1)', 
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                zIndex: 9999
            }}>
                Local notifications active
            </div>
        );
    }
    
    return null;
};

export default PushManager;