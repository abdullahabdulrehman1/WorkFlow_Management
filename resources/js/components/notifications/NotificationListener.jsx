import React, { useEffect, useState } from 'react';
import { useEcho, useEchoPublic } from '@laravel/echo-react';
import toast from 'react-hot-toast';

const NotificationListener = ({ userId }) => {
    const [connectionStatus, setConnectionStatus] = useState('connecting');

    // Add connection debugging
    useEffect(() => {
        console.log('🚀 NotificationListener mounted');
        console.log('📡 Environment variables:', {
            VITE_REVERB_APP_KEY: import.meta.env.VITE_REVERB_APP_KEY,
            VITE_REVERB_HOST: import.meta.env.VITE_REVERB_HOST,
            VITE_REVERB_PORT: import.meta.env.VITE_REVERB_PORT,
            VITE_REVERB_SCHEME: import.meta.env.VITE_REVERB_SCHEME,
        });
        
        setConnectionStatus('ready');
        console.log('✅ NotificationListener ready to receive events');
        
        return () => {
            console.log('🛑 NotificationListener unmounted');
        };
    }, []);

    // Listen for TestBroadcast events on public channel - using correct event name from Laravel
    const testChannelControl = useEchoPublic('test-channel', 'test.message', (e) => {
        console.log('🎯 TestBroadcast received:', e);
        toast.success(`Test notification: ${e.message || 'Broadcast working!'}`);
        setConnectionStatus('connected');
    });

    // Listen for WorkflowEvent on workflow channel (like the debug tool)
    const workflowChannelControl = useEchoPublic('workflow.2', 'WorkflowEvent', (e) => {
        console.log('🎯 WorkflowEvent received:', e);
        toast.success(`Workflow: ${e.message || 'Workflow event received!'}`);
        setConnectionStatus('connected');
    });

    // Listen for user-specific private notifications if userId exists
    let userWorkflowControl = null;
    let userNotificationControl = null;
    
    if (userId) {
        userWorkflowControl = useEcho(`user.${userId}`, 'WorkflowEvent', (e) => {
            console.log('🎯 User WorkflowEvent received:', e);
            toast.success(`Personal workflow: ${e.message || 'User workflow updated!'}`);
        });

        userNotificationControl = useEcho(`user.${userId}`, 'NotificationSent', (e) => {
            console.log('🎯 NotificationSent received:', e);
            toast.success(e.message || 'New notification received!');
        });
    }

    // Show connection status in development
    useEffect(() => {
        if (import.meta.env.DEV) {
            const statusColors = {
                connecting: '🟡',
                ready: '🔵', 
                connected: '🟢'
            };
            console.log(`${statusColors[connectionStatus]} NotificationListener status: ${connectionStatus}`);
        }
    }, [connectionStatus]);

    // Component doesn't render anything - it just listens for events
    return null;
};

export default NotificationListener;