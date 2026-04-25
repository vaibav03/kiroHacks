'use client';
import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';

interface AudioPlayerProps {
  audioBuffer: Uint8Array | null;
  onPlaybackStart: () => void;
  onPlaybackEnd: () => void;
  onAmplitudeUpdate: (amplitude: number) => void;
}

export interface AudioPlayerHandle {
  stop: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
  ({ audioBuffer, onPlaybackStart, onPlaybackEnd, onAmplitudeUpdate }, ref) => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const requestRef = useRef<number>();
    const isPlayingRef = useRef(false);

    // Pre-warm AudioContext on first user interaction to avoid autoplay restrictions
    useEffect(() => {
      const warmUp = () => {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      };
      document.addEventListener('click', warmUp, { once: true });
      document.addEventListener('keydown', warmUp, { once: true });
      return () => {
        document.removeEventListener('click', warmUp);
        document.removeEventListener('keydown', warmUp);
      };
    }, []);

    const stopPlayback = useCallback(() => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = undefined;
      }
      if (sourceRef.current) {
        try { sourceRef.current.stop(); } catch {}
        try { sourceRef.current.disconnect(); } catch {}
        sourceRef.current = null;
      }
      if (isPlayingRef.current) {
        isPlayingRef.current = false;
        onAmplitudeUpdate(0);
        onPlaybackEnd();
      }
    }, [onPlaybackEnd, onAmplitudeUpdate]);

    useImperativeHandle(ref, () => ({ stop: stopPlayback }), [stopPlayback]);

    useEffect(() => {
      if (!audioBuffer) {
        stopPlayback();
        return;
      }

      const playAudio = async () => {
        // Stop any currently playing audio first
        if (sourceRef.current) {
          try { sourceRef.current.stop(); } catch {}
          try { sourceRef.current.disconnect(); } catch {}
        }
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        analyserRef.current = ctx.createAnalyser();
        analyserRef.current.fftSize = 256;

        const decodedData = await ctx.decodeAudioData(audioBuffer.buffer.slice(0) as ArrayBuffer);

        sourceRef.current = ctx.createBufferSource();
        sourceRef.current.buffer = decodedData;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(ctx.destination);

        sourceRef.current.onended = () => {
          if (isPlayingRef.current) {
            isPlayingRef.current = false;
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            onAmplitudeUpdate(0);
            onPlaybackEnd();
          }
        };

        isPlayingRef.current = true;
        onPlaybackStart();
        sourceRef.current.start(0);

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const updateAmplitude = () => {
          if (!analyserRef.current || !isPlayingRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
          onAmplitudeUpdate(sum / bufferLength);
          requestRef.current = requestAnimationFrame(updateAmplitude);
        };
        updateAmplitude();
      };

      playAudio().catch(console.error);

      return () => {
        stopPlayback();
      };
    }, [audioBuffer, onPlaybackStart, onPlaybackEnd, onAmplitudeUpdate, stopPlayback]);

    return <div className="hidden" aria-hidden="true" />;
  }
);

AudioPlayer.displayName = 'AudioPlayer';
export default AudioPlayer;
