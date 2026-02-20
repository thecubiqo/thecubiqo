/**
 * Audio Score Service
 * 
 * Manages background ambient scoring and singing generation hooks.
 */

export type AudioEmotion = 'calm' | 'intense' | 'mysterious' | 'uplifting' | 'melancholic';

class AudioScoreService {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private scoreGain: GainNode | null = null;
    private voiceGain: GainNode | null = null;
    private isInitialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            // Wait for user interaction to initialize AudioContext
            window.addEventListener('click', () => this.init(), { once: true });
        }
    }

    private init() {
        if (this.isInitialized) return;

        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.scoreGain = this.audioContext.createGain();
        this.voiceGain = this.audioContext.createGain();

        this.scoreGain.connect(this.masterGain);
        this.voiceGain.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);

        this.scoreGain.gain.value = 0.3; // Lower background score
        this.voiceGain.gain.value = 1.0;

        this.isInitialized = true;
        console.log('Audio Engine Initialized');
    }

    /**
     * Set background score based on AI emotion
     */
    public setAtmosphere(emotion: AudioEmotion) {
        console.log(`Setting atmosphere to: ${emotion}`);
        if (!this.isInitialized) return;

        // In a real implementation, we would cross-fade between loops
        // For now, we simulate the intensity shift
        const targetVolume = emotion === 'intense' ? 0.5 : 0.2;
        this.scoreGain?.gain.setTargetAtTime(targetVolume, this.audioContext!.currentTime, 2);
    }

    /**
     * singing generation hook (Mock for Suno/Udio/Minimax)
     */
    public async generateSinging(prompt: string): Promise<string> {
        console.log(`Generating singing for: ${prompt}`);
        // This would call a backend route that interfaces with an AI music API
        const response = await fetch('/api/audio/generate-music', {
            method: 'POST',
            body: JSON.stringify({ prompt, mode: 'singing' })
        });
        const data = await response.json();
        return data.audioUrl;
    }

    /**
     * Duck the score volume when AI is talking
     */
    public duckScore(active: boolean) {
        if (!this.isInitialized) return;
        const target = active ? 0.05 : 0.2;
        this.scoreGain?.gain.setTargetAtTime(target, this.audioContext!.currentTime, 0.5);
    }
}

export const audioScoreService = new AudioScoreService();
