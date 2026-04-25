'use client';
import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  audioBuffer: Uint8Array | null;
  onPlaybackStart: () => void;
  onPlaybackEnd: () => void;
  onAmplitudeUpdate: (amplitude: number) => void;
}

export default function AudioPlayer({ audioBuffer, onPlaybackStart, onPlaybackEnd, onAmplitudeUpdate }: AudioPlayerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!audioBuffer) return;

    const playAudio = async () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const decodedData = await ctx.decodeAudioData(audioBuffer.buffer.slice(0) as ArrayBuffer);
      
      sourceRef.current = ctx.createBufferSource();
      sourceRef.current.buffer = decodedData;
      
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(ctx.destination);
      
      sourceRef.current.onended = () => {
        onPlaybackEnd();
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        onAmplitudeUpdate(0);
      };

      onPlaybackStart();
      sourceRef.current.start(0);

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateAmplitude = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        onAmplitudeUpdate(avg);
        requestRef.current = requestAnimationFrame(updateAmplitude);
      };
      
      updateAmplitude();
    };

    playAudio().catch(console.error);

    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch(e){}
        sourceRef.current.disconnect();
      }
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [audioBuffer, onPlaybackStart, onPlaybackEnd, onAmplitudeUpdate]);

  return <div className="hidden" aria-hidden="true" />;
}
