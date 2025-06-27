import { Audio } from 'expo-av';
import { Platform } from 'react-native';

export class SoundGenerator {
    private static audioContext: AudioContext | null = null;

    // Initialize audio context for web
    private static getAudioContext(): AudioContext | null {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
            if (!this.audioContext) {
                // @ts-ignore - AudioContext exists in browsers
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            return this.audioContext;
        }
        return null;
    }

    // Generate a simple beep sound programmatically
    static async playBeep(frequency = 800, duration = 200, volume = 0.3): Promise<void> {
        try {
            if (Platform.OS === 'web') {
                // Web implementation using Web Audio API
                const audioContext = this.getAudioContext();
                if (!audioContext) return;

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';

                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + duration / 1000);
            } else {
                // For mobile, we could use expo-av to play a generated tone
                // For now, we'll use a simple approach
                console.log('Beep sound triggered for mobile - using vibration as primary notification');
            }
        } catch (error) {
            console.log('Error generating beep:', error);
        }
    }

    // Play a series of beeps for completion notification
    static async playCompletionBeeps(): Promise<void> {
        try {
            // Three gentle beeps
            await this.playBeep(600, 150, 0.2);
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.playBeep(700, 150, 0.2);
            await new Promise(resolve => setTimeout(resolve, 100));
            await this.playBeep(800, 300, 0.25);
        } catch (error) {
            console.log('Error playing completion beeps:', error);
        }
    }
}
