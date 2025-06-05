// Sound Manager for handling audio playback in Electron renderer process
class SoundManager {
    constructor() {
        this.audioElements = new Map();
        this.isInitialized = false;
        console.log('🔊 SoundManager constructor called');
        this.setupEventListeners();
    }

    // Setup IPC event listeners for sound control
    setupEventListeners() {
        console.log('🔧 Setting up sound event listeners...');
        console.log('🔍 Window object:', typeof window);
        console.log('🔍 Window.electron:', typeof window !== 'undefined' ? !!window.electron : 'no window');
        
        if (typeof window !== 'undefined' && window.electron) {
            console.log('✅ Electron environment detected, setting up IPC listeners');
            console.log('🔧 Available electron APIs:', Object.keys(window.electron));
            
            // Listen for play-sound events from main process
            if (window.electron.ipcRenderer) {
                console.log('✅ IPC Renderer available, registering sound events');
                
                window.electron.ipcRenderer.on('play-sound', (event, data) => {
                    console.log('🔊 Received play-sound event from main process:', data);
                    this.playSound(data.soundPath, data.soundType, data.loop);
                });

                window.electron.ipcRenderer.on('stop-sound', (event, data) => {
                    console.log('🔇 Received stop-sound event from main process:', data);
                    this.stopSound(data.soundType);
                });
                
                this.isInitialized = true;
                console.log('✅ SoundManager IPC listeners registered successfully');
            } else {
                console.warn('⚠️ IPC Renderer not available in electron object');
            }
        } else {
            console.log('📱 Web environment detected (no Electron), direct audio playback available');
            this.isInitialized = true;
        }
    }

    // Play sound file
    async playSound(soundPath, soundType = 'default', loop = false) {
        try {
            console.log(`🔊 SoundManager.playSound called:`, {
                soundPath,
                soundType,
                loop,
                isInitialized: this.isInitialized
            });
            
            // Stop any existing sound of this type
            this.stopSound(soundType);

            // Create new audio element
            const fullPath = soundPath.startsWith('/') ? soundPath : `/${soundPath}`;
            console.log(`🎵 Creating audio element with path: ${fullPath}`);
            
            const audio = new Audio(fullPath);
            audio.loop = loop;
            audio.volume = 0.8; // Set volume to 80%
            
            // Store reference
            this.audioElements.set(soundType, audio);

            // Add event listeners for debugging
            audio.addEventListener('loadstart', () => {
                console.log(`🎵 Audio loading started for ${soundType}`);
            });
            
            audio.addEventListener('canplay', () => {
                console.log(`🎵 Audio can play for ${soundType}`);
            });
            
            audio.addEventListener('loadeddata', () => {
                console.log(`🎵 Audio data loaded for ${soundType}`);
            });

            audio.addEventListener('play', () => {
                console.log(`🎵 Audio play event triggered for ${soundType}`);
            });

            audio.addEventListener('playing', () => {
                console.log(`🎵 Audio is now playing for ${soundType}`);
            });

            // Play the sound
            console.log(`🎵 Attempting to play sound: ${soundType}`);
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
                console.log(`✅ Sound started playing successfully: ${soundType}`);
            }

            // Handle audio end event
            audio.addEventListener('ended', () => {
                console.log(`🎵 Audio ended for ${soundType}, loop: ${loop}`);
                if (!loop) {
                    this.audioElements.delete(soundType);
                }
            });

            // Handle audio error
            audio.addEventListener('error', (error) => {
                console.error(`❌ Audio error for ${soundType}:`, error);
                console.error(`❌ Audio error details:`, audio.error);
                console.error(`❌ Audio error code:`, audio.error?.code);
                console.error(`❌ Audio error message:`, audio.error?.message);
                this.audioElements.delete(soundType);
            });

            return true;
        } catch (error) {
            console.error(`❌ Failed to play sound ${soundType}:`, error);
            return false;
        }
    }

    // Stop sound playback
    stopSound(soundType) {
        const audio = this.audioElements.get(soundType);
        if (audio) {
            try {
                audio.pause();
                audio.currentTime = 0;
                this.audioElements.delete(soundType);
                console.log(`🔇 Stopped sound: ${soundType}`);
            } catch (error) {
                console.error(`❌ Error stopping sound ${soundType}:`, error);
            }
        } else {
            console.log(`🔇 No active sound found for type: ${soundType}`);
        }
    }

    // Stop all sounds
    stopAllSounds() {
        console.log(`🔇 Stopping all sounds. Active sounds: ${this.audioElements.size}`);
        this.audioElements.forEach((audio, soundType) => {
            this.stopSound(soundType);
        });
    }

    // Test sound playback
    async testSound() {
        console.log('🧪 Testing sound playback...');
        return await this.playSound('sounds/test.mp3', 'test', false);
    }
    
    // Get status
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            activeSounds: Array.from(this.audioElements.keys()),
            isElectron: typeof window !== 'undefined' && !!window.electron
        };
    }
}

// Create singleton instance
const soundManager = new SoundManager();

// Add global access for debugging
if (typeof window !== 'undefined') {
    window.soundManager = soundManager;
    console.log('🔧 SoundManager available globally as window.soundManager');
}

export default soundManager;