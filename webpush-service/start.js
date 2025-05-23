#!/usr/bin/env node

/**
 * Script to start the web push notification service
 * This checks for VAPID keys and starts the service
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// ES6 module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '.env') });

// Check for required VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contact@yourapp.com';

// Clean VAPID keys by removing padding characters (=)
function cleanVapidKey(key) {
    if (!key) return key;
    // Remove any = padding characters
    return key.replace(/=/g, '');
}

// Function to load VAPID keys from Laravel .env if not found in our .env
function loadVapidKeysFromLaravel() {
    try {
        const laravelEnvPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(laravelEnvPath)) {
            const envFile = fs.readFileSync(laravelEnvPath, 'utf8');
            const publicKeyMatch = envFile.match(/VAPID_PUBLIC_KEY=([^\n]+)/);
            const privateKeyMatch = envFile.match(/VAPID_PRIVATE_KEY=([^\n]+)/);
            const subjectMatch = envFile.match(/VAPID_SUBJECT=([^\n]+)/);
            
            if (publicKeyMatch && publicKeyMatch[1] && privateKeyMatch && privateKeyMatch[1]) {
                // Clean the keys before using them
                const publicKey = cleanVapidKey(publicKeyMatch[1]);
                const privateKey = cleanVapidKey(privateKeyMatch[1]);
                
                // Update our .env file
                let envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
                
                // Replace or add the VAPID keys
                envContent = envContent.replace(/VAPID_PUBLIC_KEY=.*/, `VAPID_PUBLIC_KEY=${publicKey}`);
                envContent = envContent.replace(/VAPID_PRIVATE_KEY=.*/, `VAPID_PRIVATE_KEY=${privateKey}`);
                
                if (subjectMatch && subjectMatch[1]) {
                    envContent = envContent.replace(/VAPID_SUBJECT=.*/, `VAPID_SUBJECT=${subjectMatch[1]}`);
                }
                
                fs.writeFileSync(path.join(__dirname, '.env'), envContent);
                console.log('VAPID keys imported from Laravel .env');
                
                return {
                    publicKey: publicKey,
                    privateKey: privateKey,
                    subject: subjectMatch ? subjectMatch[1] : vapidSubject
                };
            }
        }
    } catch (error) {
        console.error('Failed to load VAPID keys from Laravel .env:', error);
    }
    return null;
}

// Main function to start the service
async function startService() {
    console.log('Starting Web Push Notification Service...');
    
    // Check for VAPID keys
    let keys = { publicKey: vapidPublicKey, privateKey: vapidPrivateKey, subject: vapidSubject };
    
    if (!keys.publicKey || !keys.privateKey) {
        console.log('VAPID keys not found in .env, trying to load from Laravel .env...');
        keys = loadVapidKeysFromLaravel();
    }
    
    if (!keys || !keys.publicKey || !keys.privateKey) {
        console.error('ERROR: VAPID keys are required to run the web push service.');
        console.error('Please make sure your .env file contains:');
        console.error('  VAPID_PUBLIC_KEY=your_public_key');
        console.error('  VAPID_PRIVATE_KEY=your_private_key');
        console.error('  VAPID_SUBJECT=mailto:your@email.com');
        process.exit(1);
    }
    
    // Start the server
    console.log(`Starting server with Node.js ${process.version}...`);
    
    const server = spawn('node', [path.join(__dirname, 'index.js')], {
        env: { ...process.env },
        stdio: 'inherit'
    });
    
    server.on('close', (code) => {
        console.log(`Web Push service exited with code ${code}`);
    });
    
    process.on('SIGINT', () => {
        console.log('Shutting down Web Push service...');
        server.kill('SIGINT');
    });
}

// Run the service
startService().catch(err => {
    console.error('Failed to start Web Push service:', err);
    process.exit(1);
});