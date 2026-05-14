import { getModel } from './config/llm';

export type ModelRole =
  | 'reasoning'
  | 'utility'
  | 'vision'
  | 'stt'
  | 'tts'
  | 'computer_use'
  | 'code'
  | 'embedding';

function env(key: string, fallback: string) {
  return (process.env[key] || fallback).trim();
}

export function getPhaseBModel(role: ModelRole) {
  switch (role) {
    case 'reasoning':
      return env('MODEL_REASONING', getModel('agent'));
    case 'utility':
      return env('MODEL_UTILITY', getModel('utility'));
    case 'vision':
      return env('MODEL_VISION', 'gpt-4o-mini');
    case 'stt':
      return env('MODEL_STT', 'whisper-1');
    case 'tts':
      return env('MODEL_TTS', 'eleven_multilingual_v2');
    case 'computer_use':
      return env('MODEL_COMPUTER_USE', 'computer-use-preview');
    case 'code':
      return env('MODEL_CODE', getModel('agent'));
    case 'embedding':
      return env('MODEL_EMBEDDING', 'text-embedding-3-small');
    default:
      return getModel('utility');
  }
}
