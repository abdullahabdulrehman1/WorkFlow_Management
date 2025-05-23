import express from 'express';
import bodyParser from 'body-parser';
import webpush from 'web-push';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize environment variables
dotenv.config();

// Create Express app
const app = express();

// Set up specific origins instead of wildcard for CORS
const allowedOrigins = ['http://localhost:8000', 'http://127.0.0.1:8000', 'http://localhost:3000'];

// Pre-flight OPTIONS request handler
app.options('*', (req, res) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    }
    res.sendStatus(200);
});

// CORS middleware for all other requests
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    } else {
        // For requests without origin header (like curl or direct browser requests)
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    
    next();
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Function to generate and save VAPID keys if they don't exist
function ensureVapidKeys() {
    let publicKey = process.env.VAPID_PUBLIC_KEY;
    let privateKey = process.env.VAPID_PRIVATE_KEY;
    let subject = process.env.VAPID_SUBJECT || 'mailto:contact@yourapp.com';
    
    // Try to load from Laravel .env if not in process.env
    if (!publicKey || !privateKey) {
        try {
            const laravelEnvPath = path.join(__dirname, '..', '.env');
            if (fs.existsSync(laravelEnvPath)) {
                const envFile = fs.readFileSync(laravelEnvPath, 'utf8');
                const publicKeyMatch = envFile.match(/VAPID_PUBLIC_KEY=(.*)/);
                const privateKeyMatch = envFile.match(/VAPID_PRIVATE_KEY=(.*)/);
                const subjectMatch = envFile.match(/VAPID_SUBJECT=(.*)/);
                
                if (publicKeyMatch && publicKeyMatch[1]) publicKey = publicKeyMatch[1];
                if (privateKeyMatch && privateKeyMatch[1]) privateKey = privateKeyMatch[1];
                if (subjectMatch && subjectMatch[1]) subject = subjectMatch[1];
            }
        } catch (error) {
            console.error('Error reading Laravel .env:', error);
        }
    }
    
    // If keys still don't exist, generate new ones
    if (!publicKey || !privateKey) {
        console.warn('No VAPID keys found - generating new ones');
        const vapidKeys = webpush.generateVAPIDKeys();
        publicKey = vapidKeys.publicKey;
        privateKey = vapidKeys.privateKey;
        
        // Save generated keys to .env.local in the web push service directory
        try {
            const keysData = `VAPID_PUBLIC_KEY=${publicKey}
VAPID_PRIVATE_KEY=${privateKey}
VAPID_SUBJECT=${subject}`;
            
            fs.writeFileSync(path.join(__dirname, '.env.local'), keysData);
            console.log('Generated VAPID keys saved to .env.local file');
        } catch (error) {
            console.error('Failed to save generated VAPID keys:', error);
        }
    }
    
    // Set VAPID details for web-push
    webpush.setVapidDetails(subject, publicKey, privateKey);
    console.log('VAPID keys configured successfully');
    return { publicKey, privateKey, subject };
}

// Ensure we have VAPID keys before starting the server
const vapidKeys = ensureVapidKeys();

// Routes
app.get('/', (req, res) => {
    res.send('Web Push Notification Service is running');
});

// Serve the test page
app.get('/test-push', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-push.html'));
});

// Endpoint to store test subscription
app.post('/save-subscription', (req, res) => {
    const subscription = req.body;
    
    if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ 
            success: false, 
            error: 'Invalid subscription object' 
        });
    }
    
    // Store the subscription in the app locals for testing
    app.locals.testSubscription = subscription;
    console.log('Test subscription saved:', subscription.endpoint);
    
    res.json({ success: true });
});

// Endpoint to remove subscription
app.post('/remove-subscription', (req, res) => {
    app.locals.testSubscription = null;
    console.log('Test subscription removed');
    res.json({ success: true });
});

// Simple GET endpoint to trigger push notification via URL
app.get('/trigger', async (req, res) => {
    // Get parameters from query string
    const title = req.query.title || 'Test Notification';
    const body = req.query.body || 'This is a test notification!';
    const icon = req.query.icon || '/icon-192x192.png';
    
    console.log('Trigger endpoint accessed with params:', req.query);
    
    // Check if we have an active subscription
    if (!app.locals.testSubscription) {
        console.log('No active subscription found');
        
        // Return JSON format response
        return res.status(400).json({
            success: false,
            error: 'No active subscription found. Please visit /test-push to register first.'
        });
    }

    try {
        // Send notification to the stored subscription
        console.log('Attempting to send notification to:', app.locals.testSubscription.endpoint);
        
        await webpush.sendNotification(
            app.locals.testSubscription,
            JSON.stringify({
                title: title,
                body: body,
                icon: icon
            })
        );
        
        console.log('Notification sent successfully');
        
        // Always return JSON format response
        return res.status(200).json({
            success: true,
            message: 'Push notification sent successfully',
            details: {
                title: title,
                body: body
            }
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
        
        // Add more detailed error logging to help diagnose the issue
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code || 'unknown'
        });
        
        // Always return JSON format response with error details
        return res.status(500).json({
            success: false,
            error: error.message,
            errorName: error.name,
            errorCode: error.code || 'unknown'
        });
    }
});

// Get VAPID public key
app.get('/vapid-public-key', (req, res) => {
    // Only expose the public key
    let publicKey;
    
    try {
        // First try to get it from environment variables
        publicKey = process.env.VAPID_PUBLIC_KEY;
        
        // If not available, try to get from Laravel .env
        if (!publicKey) {
            const laravelEnvPath = path.join(__dirname, '..', '.env');
            if (fs.existsSync(laravelEnvPath)) {
                const envFile = fs.readFileSync(laravelEnvPath, 'utf8');
                const publicKeyMatch = envFile.match(/VAPID_PUBLIC_KEY=(.*)/);
                if (publicKeyMatch && publicKeyMatch[1]) {
                    publicKey = publicKeyMatch[1];
                }
            }
        }
        
        // If still not available, generate a new pair (this should be a last resort)
        if (!publicKey) {
            console.warn('No VAPID keys found, generating new ones - this is not recommended for production');
            const vapidKeys = webpush.generateVAPIDKeys();
            publicKey = vapidKeys.publicKey;
        }
        
        if (!publicKey) {
            throw new Error('Could not obtain VAPID public key');
        }
        
        console.log('Returning VAPID public key to client');
        res.json({ 
            vapidPublicKey: publicKey,
            success: true 
        });
    } catch (error) {
        console.error('Error getting VAPID public key:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get VAPID public key: ' + error.message 
        });
    }
});

// Send push notification
app.post('/send', async (req, res) => {
    const { subscription, payload } = req.body;
    
    if (!subscription || !payload) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing subscription or payload' 
        });
    }

    try {
        const result = await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );
        
        console.log(`Push notification sent successfully: ${JSON.stringify(payload.title)}`);
        res.status(200).json({ 
            success: true, 
            message: 'Notification sent successfully', 
            result 
        });
    } catch (error) {
        console.error('Error sending push notification:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Send push notification to multiple subscriptions
app.post('/send-bulk', async (req, res) => {
    const { subscriptions, payload } = req.body;
    
    if (!Array.isArray(subscriptions) || !payload) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing subscriptions array or payload' 
        });
    }

    const results = {
        success: [],
        failed: []
    };

    // Process each subscription
    await Promise.all(subscriptions.map(async (subscription) => {
        try {
            await webpush.sendNotification(
                subscription,
                JSON.stringify(payload)
            );
            results.success.push(subscription.endpoint);
        } catch (error) {
            console.error(`Error sending to ${subscription.endpoint}:`, error);
            results.failed.push({
                endpoint: subscription.endpoint,
                error: error.message
            });
        }
    }));

    res.status(200).json({
        success: results.failed.length === 0,
        results
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Web Push service running on port ${PORT}`);
    console.log(`VAPID subject: ${vapidKeys.subject}`);
});
