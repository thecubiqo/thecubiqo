'use client';

import { Mic, Square } from 'lucide-react';
import { useRef, useState } from 'react';

interface Props {
  onTranscript: (text: string) => void;
  language?: string;
}

export function VoiceInput({ onTranscript, language = 'en-US' }: Props) {
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  function start() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const text = event.results?.[0]?.[0]?.transcript;
      if (text) onTranscript(text);
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    setRecording(true);
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${recording ? 'border-red-400 text-red-300' : 'border-slate-700 text-slate-300'}`}
      title={recording ? 'Stop recording' : 'Start voice input'}
    >
      {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
