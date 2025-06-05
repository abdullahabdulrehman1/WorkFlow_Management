import React from 'react';
import { toast } from 'react-hot-toast';
import desktopCallService from '../services/DesktopCallService';

const NotificationTest = () => {
    // Test simple Windows notification
    const testSimpleNotification = async () => {
        try {
            const result = await desktopCallService.showSimpleNotification(
                'Test Notification',
                'This is a simple Windows notification test!'
            );
            
            if (result) {
                toast.success('Windows notification sent!');
            } else {
                toast.error('Running in browser - check console for details');
            }
        } catch (error) {
            console.error('Error testing notification:', error);
            toast.error('Error: ' + error.message);
        }
    };

    // Test call notification
    const testCallNotification = async () => {
        try {
            const result = await desktopCallService.showNativeCallNotification({
                callerName: 'John Doe',
                callType: 'voice',
                callId: 'test-call-' + Date.now()
            });
            
            if (result) {
                toast.success('Call notification sent!');
            } else {
                toast.error('Running in browser - check console for details');
            }
        } catch (error) {
            console.error('Error testing call notification:', error);
            toast.error('Error: ' + error.message);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Windows Notification Test</h3>
            <div className="space-y-2">
                <button
                    onClick={testSimpleNotification}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2"
                >
                    Test Simple Notification
                </button>
                <button
                    onClick={testCallNotification}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                    Test Call Notification
                </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
                {desktopCallService.isElectronApp() 
                    ? '✅ Running in Electron - notifications will show as Windows toasts'
                    : '⚠️ Running in browser - will show as web toasts'
                }
            </p>
        </div>
    );
};

export default NotificationTest;