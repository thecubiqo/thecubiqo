'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { RGYMode } from '@/next/types/av';
import { getToneForMode } from '@/next/lib/av/tone-config';

type Props = {
  isPlaying: boolean;
  mode: RGYMode;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  className?: string;
  barCount?: number;
};

export function WaveformAnimator({ isPlaying, mode, audioRef, className = '', barCount = 32 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const tone = getToneForMode(mode);

  const initAudioContext = useCallback(() => {
    if (!audioRef.current || contextRef.current) return;
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const context = new AudioContextCtor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 64;
    const source = context.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(context.destination);
    contextRef.current = context;
    analyserRef.current = analyser;
    sourceRef.current = source;
  }, [audioRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;

    const context = ctx;
    const width = canvas.width;
    const height = canvas.height;
    const gap = 2;
    const barWidth = Math.max(2, Math.floor(width / barCount) - gap);

    function drawBar(index: number, barHeight: number, color: string) {
      const x = index * (barWidth + gap);
      const y = height / 2 - barHeight / 2;
      context.fillStyle = color;
      context.beginPath();
      context.roundRect(x, y, barWidth, barHeight, 2);
      context.fill();
    }

    function drawIdle() {
      context.clearRect(0, 0, width, height);
      for (let i = 0; i < barCount; i += 1) {
        const wave = Math.sin(Date.now() / 850 + i * 0.45);
        drawBar(i, Math.max(3, tone.idleAmplitude + wave * 3), `${tone.waveformColor}99`);
      }
      animationRef.current = requestAnimationFrame(drawIdle);
    }

    function drawActive() {
      context.clearRect(0, 0, width, height);
      const data = new Uint8Array(analyserRef.current?.frequencyBinCount || 32);
      analyserRef.current?.getByteFrequencyData(data);
      for (let i = 0; i < barCount; i += 1) {
        const bin = Math.floor((i / barCount) * data.length);
        const value = (data[bin] || 0) / 255;
        drawBar(i, Math.max(4, value * tone.waveformAmplitude), tone.waveformColor);
      }
      animationRef.current = requestAnimationFrame(drawActive);
    }

    cancelAnimationFrame(animationRef.current);
    if (isPlaying) {
      initAudioContext();
      contextRef.current?.resume().catch(() => {});
      drawActive();
    } else {
      drawIdle();
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [barCount, initAudioContext, isPlaying, tone.idleAmplitude, tone.waveformAmplitude, tone.waveformColor]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 6}
      height={64}
      className={className}
      aria-label="Voice waveform"
    />
  );
}
