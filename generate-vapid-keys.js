// Simple script to generate VAPID keys for Web Push
import webpush from 'web-push';

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID keys generated successfully!');
console.log('Public key:', vapidKeys.publicKey);
console.log('Private key:', vapidKeys.privateKey);
console.log('\nAdd these keys to your .env file:');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);