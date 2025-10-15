/**
 * 🎙️ Voice Service
 *
 * Handles voice input (Speech Recognition) and output (Text-to-Speech)
 * Includes iOS Safari compatibility fixes
 */

class VoiceService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    this.onTranscriptCallback = null;
    this.onErrorCallback = null;

    this.initRecognition();
  }

  /**
   * Initialize Speech Recognition (Web Speech API)
   */
  initRecognition() {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;      // Single utterance
    this.recognition.interimResults = false;  // Only final results
    this.recognition.lang = 'en-US';          // Language (can be made dynamic)

    // Event handlers
    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (this.onTranscriptCallback) {
        this.onTranscriptCallback(transcript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  /**
   * Start listening for voice input
   * iOS Safari: Requires user gesture (tap) to activate
   */
  startListening(onTranscript, onError) {
    if (!this.recognition) {
      onError?.('Speech recognition not available');
      return;
    }

    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      // Handle "already started" error
      if (error.message.includes('already started')) {
        this.recognition.stop();
        setTimeout(() => this.startListening(onTranscript, onError), 100);
      } else {
        console.error('Error starting recognition:', error);
        onError?.(error.message);
      }
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Speak text using browser TTS
   * iOS Safari: Auto-play might be blocked, requires user gesture
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configuration
      utterance.rate = options.rate || 1.0;      // Speed (0.1 to 10)
      utterance.pitch = options.pitch || 1.0;    // Pitch (0 to 2)
      utterance.volume = options.volume || 1.0;  // Volume (0 to 1)
      utterance.lang = options.lang || 'en-US';

      // Select voice (prefer female voice if available)
      const voices = this.synthesis.getVoices();
      const preferredVoice = voices.find(voice =>
        voice.lang.startsWith('en') && voice.name.includes('Female')
      ) || voices.find(voice => voice.lang.startsWith('en'));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (error) => {
        console.error('TTS error:', error);
        reject(error);
      };

      // Speak
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    this.synthesis.cancel();
  }

  /**
   * Check if browser supports voice features
   */
  isSupported() {
    return {
      recognition: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
      synthesis: !!window.speechSynthesis
    };
  }

  /**
   * iOS Safari: Activate audio context (must be called from user gesture)
   * This is CRITICAL for iOS compatibility!
   */
  activateAudioContext() {
    // Load voices (required on some browsers)
    if (this.synthesis.getVoices().length === 0) {
      // Trigger voices loading
      const utterance = new SpeechSynthesisUtterance('');
      this.synthesis.speak(utterance);
      this.synthesis.cancel();
    }

    return true;
  }
}

// Export singleton instance
export default new VoiceService();
