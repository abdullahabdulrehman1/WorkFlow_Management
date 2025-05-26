import React, { useState, useEffect } from 'react';
import { makeCall, getTestPhoneNumbers } from '../utils/CallService';
import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Define styles for the component
const styles = {
    container: {
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
    },
    header: {
        color: '#333',
        borderBottom: '1px solid #ddd',
        paddingBottom: '10px',
        marginBottom: '20px',
    },
    phoneCard: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px',
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    contactName: {
        fontWeight: 'bold',
        marginBottom: '5px',
    },
    contactNumber: {
        color: '#777',
    },
    buttonsContainer: {
        display: 'flex',
        gap: '10px',
    },
    callButton: {
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    videoCallButton: {
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    customNumberContainer: {
        marginTop: '30px',
        padding: '20px',
        borderTop: '1px solid #ddd',
    },
    input: {
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ddd',
        marginRight: '10px',
        width: '200px',
    },
    envInfo: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        fontSize: '14px',
    },
    statusBox: {
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '4px',
    },
    debugSection: {
        marginTop: '30px',
        borderTop: '1px solid #ddd',
        paddingTop: '20px',
    },
    debugButton: {
        backgroundColor: '#ff9800',
        color: 'white',
        border: 'none',
        padding: '8px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '10px',
    },
    debugInfo: {
        marginTop: '15px',
        padding: '15px',
        backgroundColor: '#fff3e0',
        border: '1px solid #ffe0b2',
        borderRadius: '4px',
        maxHeight: '300px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '12px',
    },
    errorInfo: {
        backgroundColor: '#ffebee',
        border: '1px solid #ffcdd2',
        padding: '15px',
        borderRadius: '4px',
        marginTop: '15px',
        color: '#c62828',
    },
    successInfo: {
        backgroundColor: '#e8f5e9',
        border: '1px solid #c8e6c9',
        padding: '15px',
        borderRadius: '4px',
        marginTop: '15px',
        color: '#2e7d32',
    }
};

/**
 * CallTest Component - A test interface for the calling functionality
 */
const CallTest = () => {
    const [customNumber, setCustomNumber] = useState('');
    const [callStatus, setCallStatus] = useState('');
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [platformInfo, setPlatformInfo] = useState({});
    const [fcmStatus, setFcmStatus] = useState(null);
    const [debugInfo, setDebugInfo] = useState(null);
    const [debugLoading, setDebugLoading] = useState(false);
    
    // Initialize test phone numbers and platform info
    useEffect(() => {
        setPhoneNumbers(getTestPhoneNumbers());
        
        // Get platform information for debugging
        const info = {
            platform: Capacitor.getPlatform ? Capacitor.getPlatform() : 'web',
            isNative: Capacitor.isNativePlatform ? Capacitor.isNativePlatform() : false,
            userAgent: navigator.userAgent,
            hasCapacitor: typeof window !== 'undefined' && window.Capacitor !== undefined,
        };
        
        setPlatformInfo(info);
        
        // Check FCM configuration status
        checkFCMStatus();
    }, []);
    
    // Check if Firebase/FCM is properly configured
    const checkFCMStatus = async () => {
        try {
            setFcmStatus({ checking: true });
            
            // First, check if we can access the backend API
            const apiResponse = await axios.get('/test-api');
            console.log('API connection test:', apiResponse.data);
            
            // Then check FCM configuration by trying to send a test notification
            const fcmResponse = await axios.post('/api/push-notify', {
                title: 'FCM Test',
                body: 'Testing FCM configuration',
            });
            
            console.log('FCM status check:', fcmResponse.data);
            
            if (fcmResponse.data.success) {
                setFcmStatus({
                    configured: true,
                    message: `FCM is properly configured. ${fcmResponse.data.sent_count || 0} device(s) available.`,
                    data: fcmResponse.data
                });
            } else if (fcmResponse.data.fallbackEnabled) {
                setFcmStatus({
                    configured: 'partial',
                    message: 'FCM is configured but using fallback notification mechanism.',
                    data: fcmResponse.data
                });
            } else {
                setFcmStatus({
                    configured: false,
                    message: fcmResponse.data.message || 'FCM might not be properly configured',
                    error: fcmResponse.data.error || null,
                    data: fcmResponse.data
                });
            }
        } catch (error) {
            console.error('Error checking FCM status:', error);
            setFcmStatus({
                configured: false,
                message: 'Could not check FCM status',
                error: error.message || 'Unknown error occurred'
            });
        }
    };
    
    // Run detailed diagnostic check
    const runDiagnostics = async () => {
        try {
            setDebugLoading(true);
            setDebugInfo(null);
            
            // Get FCM token count
            let tokenCount = 'Unknown';
            let diagnosticInfo = 'Running call system diagnostics...\n\n';
            
            try {
                const tokenResponse = await axios.get('/api/fcm/tokens/count');
                tokenCount = tokenResponse.data.count || 0;
                diagnosticInfo += `FCM Tokens available: ${tokenCount}\n`;
            } catch (err) {
                diagnosticInfo += `Could not get FCM token count: ${err.message}\n`;
            }
            
            // Check Firebase config file existence
            try {
                const configResponse = await axios.get('/api/firebase/config/check');
                const configStatus = configResponse.data.exists 
                    ? 'Firebase configuration file exists' 
                    : 'Firebase configuration file MISSING';
                diagnosticInfo += `Firebase config: ${configStatus}\n`;
                
                if (configResponse.data.path) {
                    diagnosticInfo += `Config path: ${configResponse.data.path}\n`;
                }
            } catch (err) {
                diagnosticInfo += `Could not check Firebase config: ${err.message}\n`;
            }
            
            // Check notification permissions
            if (typeof Notification !== 'undefined') {
                diagnosticInfo += `Notification permission: ${Notification.permission}\n`;
            } else {
                diagnosticInfo += 'Notification API not available in this browser\n';
            }
            
            // Add platform info
            diagnosticInfo += '\nPlatform Information:\n';
            diagnosticInfo += JSON.stringify(platformInfo, null, 2) + '\n';
            
            // Add FCM status
            diagnosticInfo += '\nFCM Status:\n';
            diagnosticInfo += JSON.stringify(fcmStatus, null, 2) + '\n';
            
            setDebugInfo(diagnosticInfo);
        } catch (error) {
            setDebugInfo(`Error running diagnostics: ${error.message}`);
        } finally {
            setDebugLoading(false);
        }
    };
    
    // Handle making a call
    const handleCall = async (phoneNumber, isVideo = false) => {
        try {
            setCallStatus(`Attempting to ${isVideo ? 'video ' : ''}call ${phoneNumber}...`);
            
            // Call the makeCall function from our CallService
            const result = await makeCall(phoneNumber, isVideo);
            
            // Update status based on result
            if (result.success) {
                setCallStatus(`Successfully initiated ${isVideo ? 'video ' : ''}call to ${phoneNumber} via ${result.platform || 'unknown platform'}`);
                
                // Add more detailed information
                if (result.platform === 'fcm') {
                    setCallStatus(prev => `${prev}\nCall notification sent to ${result.sentToDevices} device(s). Call ID: ${result.callId}`);
                    toast.success(`Call notification sent to ${result.sentToDevices} device(s)`);
                }
            } else {
                const errorDetails = result.error ? `\nError details: ${result.error}` : '';
                setCallStatus(`Failed to call ${phoneNumber}: ${result.error || 'Unknown error'}${errorDetails}`);
                
                // Check common issues
                if (!fcmStatus?.configured) {
                    setCallStatus(prev => `${prev}\n\nPossible issue: FCM is not configured correctly. Run diagnostics for more information.`);
                }
            }
        } catch (error) {
            console.error('Call error:', error);
            setCallStatus(`Error: ${error.message || 'Unknown error occurred'}`);
            
            if (error.response) {
                // Server error response
                const serverError = error.response.data.message || JSON.stringify(error.response.data);
                setCallStatus(prev => `${prev}\n\nServer error: ${serverError}`);
            }
        }
    };
    
    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Call Test Interface</h1>
            
            {/* FCM Status Information */}
            <div style={fcmStatus?.configured === true ? styles.successInfo : 
                       fcmStatus?.configured === false ? styles.errorInfo : 
                       styles.statusBox}>
                <h3>FCM Status</h3>
                {fcmStatus === null ? (
                    <p>Checking FCM configuration...</p>
                ) : fcmStatus.checking ? (
                    <p>Checking FCM configuration...</p>
                ) : (
                    <p>{fcmStatus.message}</p>
                )}
                {fcmStatus?.error && <p style={{ fontWeight: 'bold' }}>Error: {fcmStatus.error}</p>}
                <button 
                    style={styles.debugButton}
                    onClick={checkFCMStatus}
                >
                    Refresh FCM Status
                </button>
            </div>
            
            {/* Display test phone numbers */}
            <div>
                <h2>Test Contacts</h2>
                {phoneNumbers.map((contact, index) => (
                    <div key={index} style={styles.phoneCard}>
                        <div>
                            <div style={styles.contactName}>{contact.name}</div>
                            <div style={styles.contactNumber}>{contact.number}</div>
                        </div>
                        <div style={styles.buttonsContainer}>
                            <button 
                                style={styles.callButton}
                                onClick={() => handleCall(contact.number, false)}
                            >
                                Call
                            </button>
                            <button 
                                style={styles.videoCallButton}
                                onClick={() => handleCall(contact.number, true)}
                            >
                                Video
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Custom phone number input */}
            <div style={styles.customNumberContainer}>
                <h2>Custom Number</h2>
                <div>
                    <input 
                        style={styles.input}
                        type="tel" 
                        placeholder="Enter phone number" 
                        value={customNumber}
                        onChange={(e) => setCustomNumber(e.target.value)}
                    />
                    <button 
                        style={styles.callButton}
                        onClick={() => handleCall(customNumber, false)}
                    >
                        Call
                    </button>
                    <button 
                        style={styles.videoCallButton}
                        onClick={() => handleCall(customNumber, true)}
                    >
                        Video
                    </button>
                </div>
            </div>
            
            {/* Call status display */}
            {callStatus && (
                <div style={styles.statusBox}>
                    <h3>Call Status</h3>
                    <pre>{callStatus}</pre>
                </div>
            )}
            
            {/* Debug section */}
            <div style={styles.debugSection}>
                <h2>Diagnostics</h2>
                <p>Use these tools to diagnose call notification issues</p>
                
                <button 
                    style={styles.debugButton}
                    onClick={runDiagnostics}
                    disabled={debugLoading}
                >
                    {debugLoading ? 'Running...' : 'Run Diagnostics'}
                </button>
                
                {debugInfo && (
                    <div style={styles.debugInfo}>
                        {debugInfo}
                    </div>
                )}
                
                {/* Environment info for debugging */}
                <div style={styles.envInfo}>
                    <h3>Environment Info</h3>
                    <pre>{JSON.stringify(platformInfo, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
};

export default CallTest;