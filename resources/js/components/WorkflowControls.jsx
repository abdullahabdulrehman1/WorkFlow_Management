import React from 'react';
import { toast } from 'react-hot-toast';
import { subscribeToPush } from '../components/notifications/PushManager';
import useIsMobile from '../hooks/useIsMobile';
import DesktopWorkflowControls from './workflow/DesktopWorkflowControls';
import MobileWorkflowControls from './workflow/MobileWorkflowControls';
export default function WorkflowControls({ 
    workflow, 
    isDraftOpen, 
    setIsDraftOpen, 
    justSaved, 
    onSave, 
    onClearCanvas 
}) {
    const isMobile = useIsMobile();
    
    // Enhanced save handler that also subscribes to push notifications
    const handleSaveAndSubscribe = async () => {
        // First, save the workflow
        onSave();
        
        // Then try to subscribe to push notifications
        try {
            const result = await subscribeToPush();
            if (result.success) {
                console.log('Successfully subscribed to push notifications');
            } else if (result.reason === 'permission-denied') {
                toast.error('Please enable notifications for workflow alerts');
            }
        } catch (error) {
            console.error('Error subscribing to push notifications:', error);
        }
    };
    
    const handleClearCanvas = () => {
        onClearCanvas();
        toast.success('Canvas cleared');
    };

    return isMobile ? (
        <MobileWorkflowControls
            workflow={workflow}
            isDraftOpen={isDraftOpen}
            setIsDraftOpen={setIsDraftOpen}
            justSaved={justSaved}
            onSave={handleSaveAndSubscribe}
            onClearCanvas={handleClearCanvas}
        />
    ) : (
        <DesktopWorkflowControls
            workflow={workflow}
            isDraftOpen={isDraftOpen}
            setIsDraftOpen={setIsDraftOpen}
            justSaved={justSaved}
            onSave={handleSaveAndSubscribe}
            onClearCanvas={handleClearCanvas}
        />
    );
}

// Desktop version of the controls


// Mobile version of the controls
