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
    this.recognitionTimeout = null;
    this.currentLanguage = 'en-US'; // Default language
    this.voicesLoaded = false;

    // Debug overlay
    this.debugOverlay = null;
    this.debugStatus = null;
    this.debugTimer = null;
    this.debugTranscript = null;
    this.startTime = 0;
    this.debugInterval = null;

    this.initRecognition();
    this.initVoices();
    this.initDebug();
  }

  /**
   * Initialize debug overlay (for mobile testing)
   */
  initDebug() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupDebug());
    } else {
      this.setupDebug();
    }
  }

  setupDebug() {
    this.debugOverlay = document.getElementById('debug-overlay');
    this.debugStatus = document.getElementById('debug-status');
    this.debugTimer = document.getElementById('debug-timer');
    this.debugTranscript = document.getElementById('debug-transcript');
  }

  updateDebug(status, transcript = null) {
    if (!this.debugOverlay) return;

    this.debugOverlay.style.display = 'block';
    if (this.debugStatus) this.debugStatus.textContent = `Status: ${status}`;
    if (transcript !== null && this.debugTranscript) {
      this.debugTranscript.textContent = `Transcript: ${transcript || '-'}`;
    }
  }

  /**
   * Initialize voices (load asynchronously)
   */
  initVoices() {
    // Voices might load asynchronously
    if (this.synthesis.getVoices().length > 0) {
      this.voicesLoaded = true;
    }

    // Listen for voices loaded event
    this.synthesis.addEventListener('voiceschanged', () => {
      this.voicesLoaded = true;
      console.log('✅ Voices loaded:', this.synthesis.getVoices().length);
    });
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
    this.recognition.continuous = true;       // Keep listening (don't stop on pause)
    this.recognition.interimResults = true;   // Get interim results to know user is speaking
    this.recognition.lang = this.currentLanguage;
    this.recognition.maxAlternatives = 1;     // Only best match

    // Track interim results
    this.lastInterimTime = 0;
    this.finalTranscript = '';

    // Event handlers
    this.recognition.onresult = (event) => {
      this.lastInterimTime = Date.now();

      // Build final transcript from all results
      let interimTranscript = '';
      this.finalTranscript = '';

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Clear no-speech timeout since we got speech
      clearTimeout(this.noSpeechTimeout);

      // Log interim results
      if (interimTranscript) {
        console.log(`🎤 Interim: "${interimTranscript}"`);
        this.updateDebug('🎤 Speaking...', interimTranscript);
      }

      if (this.finalTranscript.trim()) {
        this.updateDebug('✅ Got text', this.finalTranscript.trim());
      }

      // Reset silence timeout - stop 2.5 seconds after last speech
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = setTimeout(() => {
        if (this.isListening && this.finalTranscript.trim()) {
          console.log(`🎤 Final Transcript: "${this.finalTranscript.trim()}"`);
          this.updateDebug('🤐 Silence (2.5s), sending...', this.finalTranscript.trim());
          this.stopListening();
          if (this.onTranscriptCallback) {
            this.onTranscriptCallback(this.finalTranscript.trim());
          }
        }
      }, 2500); // 2.5 seconds of silence = done speaking
    };

    this.recognition.onerror = (event) => {
      clearTimeout(this.recognitionTimeout);
      console.error('Speech recognition error:', event.error);
      this.isListening = false;

      // Handle specific errors
      if (event.error === 'no-speech') {
        console.warn('No speech detected');
      } else if (event.error === 'audio-capture') {
        console.error('Microphone not accessible');
      } else if (event.error === 'not-allowed') {
        console.error('Microphone permission denied');
      }

      if (this.onErrorCallback) {
        this.onErrorCallback(event.error);
      }
    };

    this.recognition.onstart = () => {
      console.log('🎤 Listening started...');
      this.updateDebug('🎤 Listening...', '');

      // Start timer display
      this.startTime = Date.now();
      this.debugInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        if (this.debugTimer) this.debugTimer.textContent = `Timer: ${elapsed}s`;
      }, 100);

      // Safety timeout: stop after 15 seconds max
      this.recognitionTimeout = setTimeout(() => {
        if (this.isListening) {
          console.warn('⏱️ Max timeout (15s), stopping...');
          this.updateDebug('⏱️ Max timeout (15s)');
          this.stopListening();

          // If we have transcript, send it
          if (this.finalTranscript.trim() && this.onTranscriptCallback) {
            this.onTranscriptCallback(this.finalTranscript.trim());
          } else {
            this.onErrorCallback?.('timeout');
          }
        }
      }, 15000);

      // Silence timeout: stop after 5 seconds of no speech at all
      this.noSpeechTimeout = setTimeout(() => {
        if (this.isListening && !this.finalTranscript.trim()) {
          console.warn('🔇 No speech detected (5s), stopping...');
          this.updateDebug('🔇 No speech (5s)');
          this.stopListening();
          this.onErrorCallback?.('no-speech');
        }
      }, 5000);
    };

    this.recognition.onend = () => {
      clearTimeout(this.recognitionTimeout);
      clearTimeout(this.noSpeechTimeout);
      clearTimeout(this.silenceTimeout);
      clearInterval(this.debugInterval);
      this.isListening = false;
      console.log('🎤 Listening stopped');
      this.updateDebug('⏹️ Stopped');
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
    this.finalTranscript = ''; // Reset transcript

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
      clearTimeout(this.silenceTimeout);
      clearTimeout(this.noSpeechTimeout);
      clearTimeout(this.recognitionTimeout);
      clearInterval(this.debugInterval);
      this.recognition.stop();
      this.isListening = false;
      this.updateDebug('⏹️ Stopping...');
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

      // Configuration - optimized for better quality
      utterance.rate = options.rate || 0.92;     // Slightly slower for emotional delivery
      utterance.pitch = options.pitch || 1.05;   // Slightly higher for warmth
      utterance.volume = options.volume || 1.0;  // Max volume
      utterance.lang = options.lang || 'en-US';  // Force US English for consistency

      // Select best voice
      const voices = this.synthesis.getVoices();
      const voice = this.selectBestVoice(voices, utterance.lang);

      if (voice) {
        utterance.voice = voice;
        console.log(`🔊 Using voice: ${voice.name} (${voice.lang})`);
      }

      // Event handlers
      utterance.onstart = () => {
        console.log(`🔊 Speaking: "${text.substring(0, 50)}..."`);
      };

      utterance.onend = () => {
        console.log('🔊 Speech ended');
        resolve();
      };

      utterance.onerror = (error) => {
        console.error('TTS error:', error);
        reject(error);
      };

      // Speak (iOS fix: small delay)
      setTimeout(() => {
        this.synthesis.speak(utterance);
      }, 100);
    });
  }

  /**
   * Select best voice for given language
   */
  selectBestVoice(voices, lang) {
    const langPrefix = lang.split('-')[0]; // 'en' from 'en-US'

    // Debug: log all available voices (only once)
    if (!this._voicesLogged && voices.length > 0) {
      console.log('🎤 Available voices:');
      voices.filter(v => v.lang.startsWith('en')).forEach(v => {
        console.log(`  - ${v.name} (${v.lang}) ${v.localService ? '[LOCAL]' : '[ONLINE]'}`);
      });
      this._voicesLogged = true;
    }

    // Priority order: Best male US > other US voices
    const priorities = [
      // 1. Best male US voices (Reed, Aaron, Fred)
      voices.filter(v => v.lang === 'en-US' && v.localService &&
        (v.name.includes('Reed') || v.name.includes('Aaron') || v.name.includes('Fred'))),

      // 2. Other quality US voices (Eddy, Samantha)
      voices.filter(v => v.lang === 'en-US' && v.localService &&
        (v.name.includes('Eddy') || v.name.includes('Samantha'))),

      // 3. Any US local voice
      voices.filter(v => v.lang === 'en-US' && v.localService),

      // 4. Any US voice
      voices.filter(v => v.lang === 'en-US'),

      // 5. Any English local voice
      voices.filter(v => v.lang.startsWith(langPrefix) && v.localService),

      // 6. Any English voice
      voices.filter(v => v.lang.startsWith(langPrefix)),

      // 7. Default
      voices.filter(v => v.default)
    ];

    for (const group of priorities) {
      if (group.length > 0) {
        return group[0];
      }
    }

    return null;
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
    // iOS requires user interaction to unlock audio
    // This should be called on first user tap/click

    // Method 1: Trigger empty utterance to unlock audio
    const utterance = new SpeechSynthesisUtterance('');
    utterance.volume = 0;
    this.synthesis.speak(utterance);
    this.synthesis.cancel();

    // Method 2: Force voices loading
    const voices = this.synthesis.getVoices();
    if (voices.length === 0) {
      // Wait for voices to load
      setTimeout(() => {
        this.synthesis.getVoices();
      }, 100);
    }

    console.log('🔓 Audio context activated for iOS');
    return true;
  }

  /**
   * Set language for recognition and synthesis
   * @param {string} lang - Language code (e.g., 'en-US', 'ru-RU')
   */
  setLanguage(lang) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
    console.log(`🌍 Language set to: ${lang}`);
  }

  /**
   * Get current language
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get available voices for a language
   * @param {string} lang - Language code (optional)
   */
  getAvailableVoices(lang = null) {
    const voices = this.synthesis.getVoices();
    if (lang) {
      const langPrefix = lang.split('-')[0];
      return voices.filter(v => v.lang.startsWith(langPrefix));
    }
    return voices;
  }
}

// Export singleton instance
export default new VoiceService();
