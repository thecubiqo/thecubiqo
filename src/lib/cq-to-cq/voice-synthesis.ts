/**
 * Voice Synthesis for CQ-to-CQ Messaging
 * Reads incoming messages in CubiQo's voice
 */

import { getVoiceSynthesisConfig } from './supabase-client';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// OpenAI TTS as fallback
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export interface VoiceSynthesisOptions {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export interface VoiceSynthesisResult {
  audioUrl: string;
  duration: number; // seconds
  format: string;
  provider: 'elevenlabs' | 'openai' | 'system';
}

/**
 * Synthesize text to speech using ElevenLabs
 */
async function synthesizeWithElevenLabs(
  options: VoiceSynthesisOptions
): Promise<VoiceSynthesisResult> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const voiceId = options.voiceId || 'default-cubiqo-voice';

  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: options.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: options.stability ?? 0.5,
          similarity_boost: options.similarityBoost ?? 0.75,
          style: options.style ?? 0,
          use_speaker_boost: options.useSpeakerBoost ?? true,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.statusText}`);
  }

  const audioBlob = await response.blob();
  
  // Upload to storage (implement your storage solution)
  const audioUrl = await uploadAudioToStorage(audioBlob);
  
  // Estimate duration (you can use audio analysis library for accurate duration)
  const estimatedDuration = estimateAudioDuration(options.text);

  return {
    audioUrl,
    duration: estimatedDuration,
    format: 'mp3',
    provider: 'elevenlabs',
  };
}

/**
 * Synthesize text to speech using OpenAI TTS
 */
async function synthesizeWithOpenAI(
  options: VoiceSynthesisOptions
): Promise<VoiceSynthesisResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      voice: 'nova', // or 'alloy', 'echo', 'fable', 'onyx', 'shimmer'
      input: options.text,
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI TTS API error: ${response.statusText}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = await uploadAudioToStorage(audioBlob);
  const estimatedDuration = estimateAudioDuration(options.text);

  return {
    audioUrl,
    duration: estimatedDuration,
    format: 'mp3',
    provider: 'openai',
  };
}

/**
 * Main function to synthesize message to speech
 */
export async function synthesizeMessageToSpeech(
  userId: string,
  text: string
): Promise<VoiceSynthesisResult> {
  // Get user's voice synthesis configuration
  const config = await getVoiceSynthesisConfig(userId);

  if (!config || !config.enableAutoRead) {
    throw new Error('Voice synthesis not enabled for this user');
  }

  const options: VoiceSynthesisOptions = {
    text,
    voiceId: config.cubiQoVoiceId,
    stability: config.voiceSettings.stability,
    similarityBoost: config.voiceSettings.similarityBoost,
    style: config.voiceSettings.style,
    useSpeakerBoost: config.voiceSettings.useSpeakerBoost,
  };

  // Try ElevenLabs first, fallback to OpenAI
  try {
    return await synthesizeWithElevenLabs(options);
  } catch (error) {
    console.warn('ElevenLabs synthesis failed, falling back to OpenAI:', error);
    
    try {
      return await synthesizeWithOpenAI(options);
    } catch (openaiError) {
      console.error('OpenAI synthesis also failed:', openaiError);
      throw new Error('Voice synthesis failed for all providers');
    }
  }
}

/**
 * Process incoming message and generate synthesized audio
 */
export async function processIncomingMessage(
  recipientUserId: string,
  messageText: string,
  messageType: 'text' | 'voice'
): Promise<string | null> {
  try {
    const config = await getVoiceSynthesisConfig(recipientUserId);

    // Check if auto-read is enabled
    if (!config || !config.enableAutoRead) {
      return null;
    }

    // For text messages, synthesize directly
    if (messageType === 'text') {
      const result = await synthesizeMessageToSpeech(recipientUserId, messageText);
      return result.audioUrl;
    }

    // For voice messages, optionally transcribe first, then synthesize in CubiQo's voice
    // This creates the unique feature: "Your CubiQo reads it to you in CubiQo's voice"
    if (messageType === 'voice') {
      // Transcribe the voice message first
      const transcription = await transcribeAudio(messageText); // messageText is the audio URL
      
      // Then synthesize in CubiQo's voice
      const result = await synthesizeMessageToSpeech(recipientUserId, transcription);
      return result.audioUrl;
    }

    return null;
  } catch (error) {
    console.error('Error processing incoming message for voice synthesis:', error);
    return null;
  }
}

/**
 * Transcribe audio to text (for voice messages)
 */
async function transcribeAudio(audioUrl: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Download audio file
  const audioResponse = await fetch(audioUrl);
  const audioBlob = await audioResponse.blob();

  // Create form data
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.mp3');
  formData.append('model', 'whisper-1');

  // Transcribe with OpenAI Whisper
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`);
  }

  const result = await response.json();
  return result.text;
}

/**
 * Upload audio blob to storage
 * Implement this based on your storage solution (S3, Supabase Storage, etc.)
 */
async function uploadAudioToStorage(audioBlob: Blob): Promise<string> {
  // Example with Supabase Storage
  const { supabase } = await import('./supabase-client');
  
  const fileName = `cq-voice/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
  
  const { data, error } = await supabase.storage
    .from('cq-audio')
    .upload(fileName, audioBlob, {
      contentType: 'audio/mpeg',
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('cq-audio')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

/**
 * Estimate audio duration based on text length
 * Rough estimate: ~150 words per minute, ~5 characters per word
 */
function estimateAudioDuration(text: string): number {
  const wordsPerMinute = 150;
  const charactersPerWord = 5;
  const characterCount = text.length;
  const estimatedWords = characterCount / charactersPerWord;
  const estimatedMinutes = estimatedWords / wordsPerMinute;
  return Math.ceil(estimatedMinutes * 60); // Return seconds
}

/**
 * Get available voices for user selection
 */
export async function getAvailableVoices(): Promise<any[]> {
  if (!ELEVENLABS_API_KEY) {
    return [];
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch available voices');
  }

  const data = await response.json();
  return data.voices;
}

/**
 * Clone a voice for custom CubiQo personality
 */
export async function cloneVoice(
  name: string,
  description: string,
  audioFiles: File[]
): Promise<string> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);

  audioFiles.forEach((file, index) => {
    formData.append(`files[${index}]`, file);
  });

  const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Voice cloning failed');
  }

  const result = await response.json();
  return result.voice_id;
}

/**
 * Format message for natural TTS reading
 * Handles emojis, URLs, mentions, etc.
 */
export function formatTextForTTS(text: string): string {
  let formatted = text;

  // Replace emojis with descriptions
  const emojiMap: Record<string, string> = {
    '😊': 'smiling',
    '😂': 'laughing',
    '❤️': 'heart',
    '👍': 'thumbs up',
    '🔥': 'fire',
    // Add more as needed
  };

  Object.entries(emojiMap).forEach(([emoji, description]) => {
    formatted = formatted.replace(new RegExp(emoji, 'g'), ` ${description} `);
  });

  // Replace URLs with "link"
  formatted = formatted.replace(
    /https?:\/\/[^\s]+/g,
    'link'
  );

  // Replace mentions with "mentioned [name]"
  formatted = formatted.replace(
    /@(\w+)/g,
    'mentioned $1'
  );

  // Clean up extra whitespace
  formatted = formatted.replace(/\s+/g, ' ').trim();

  return formatted;
}

/**
 * Preview voice synthesis (for settings page)
 */
export async function previewVoice(
  voiceId: string,
  text: string = "Hello! This is how your CubiQo will sound when reading messages to you."
): Promise<VoiceSynthesisResult> {
  return synthesizeWithElevenLabs({
    text,
    voiceId,
    stability: 0.5,
    similarityBoost: 0.75,
  });
}
