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

    // Test call notification with Accept/Decline buttons and ringtone
    const testCallNotificationWithButtons = async () => {
        try {
            const result = await desktopCallService.showNativeCallNotification({
                callerName: 'John Doe',
                callerId: '+1234567890',
                callType: 'voice',
                callId: 'test-call-' + Date.now(),
                workflowId: 'test-workflow'
            });
            
            if (result) {
                toast.success('Call notification with buttons sent!');
            } else {
                toast.error('Running in browser - check console for details');
            }
        } catch (error) {
            console.error('Error testing call notification:', error);
            toast.error('Error: ' + error.message);
        }
    };

    // Test video call notification
    const testVideoCallNotification = async () => {
        try {
            const result = await desktopCallService.showNativeCallNotification({
                callerName: 'Jane Smith',
                callerId: '+0987654321',
                callType: 'video',
                callId: 'test-video-call-' + Date.now(),
                workflowId: 'test-workflow'
            });
            
            if (result) {
                toast.success('Video call notification with buttons sent!');
            } else {
                toast.error('Running in browser - check console for details');
            }
        } catch (error) {
            console.error('Error testing video call notification:', error);
            toast.error('Error: ' + error.message);
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Windows Notification Test</h3>
            <div className="space-y-2">
                <button
                    onClick={testSimpleNotification}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2 mb-2"
                >
                    Test Simple Notification
                </button>
                <button
                    onClick={testCallNotificationWithButtons}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mr-2 mb-2"
                >
                    Test Voice Call (with buttons & ringtone)
                </button>
                <button
                    onClick={testVideoCallNotification}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mb-2"
                >
                    Test Video Call (with buttons & ringtone)
                </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
                {desktopCallService.isElectronApp() 
                    ? '✅ Running in Electron - notifications will show as Windows popups with Accept/Decline buttons and ringtone'
                    : '⚠️ Running in browser - will show as web toasts'
                }
            </p>
            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-1">Call Notification Features:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Custom popup window with Accept/Decline buttons</li>
                    <li>• Ringtone plays automatically (loops until answered/declined)</li>
                    <li>• Window stays on top and flashes for attention</li>
                    <li>• Auto-dismisses after 30 seconds</li>
                    <li>• Beautiful gradient design with animations</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationTest;