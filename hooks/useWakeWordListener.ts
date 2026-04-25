'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { TutorId, TUTORS } from '@/lib/tutors';

interface UseWakeWordListenerOptions {
  tutorId: TutorId | null;
  isSpeaking: boolean;
  onTranscript: (text: string) => void;
}

interface UseWakeWordListenerReturn {
  isListening: boolean;
  isCapturing: boolean;
  wakeWordDetected: boolean;
}

type ListenerState = 'IDLE' | 'LISTENING' | 'CAPTURING' | 'PAUSED' | 'RESTARTING';

const GREETING_PREFIXES = ['hi', 'hey', 'hello', 'ok', 'okay'];

/**
 * Extract wake-word names from a tutor's full name.
 * e.g. "Albert Einstein" → ["albert", "einstein"]
 */
function getWakeWords(tutorId: TutorId): string[] {
  const name = TUTORS[tutorId].name;
  return name.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * Build all valid wake-word patterns for a tutor.
 * Returns patterns sorted longest-first so we strip the longest match.
 */
export function buildWakePatterns(tutorId: TutorId): string[] {
  const names = getWakeWords(tutorId);
  const patterns: string[] = [];

  // greeting + name combinations
  for (const greeting of GREETING_PREFIXES) {
    for (const name of names) {
      patterns.push(`${greeting} ${name}`);
    }
  }

  // standalone names
  for (const name of names) {
    patterns.push(name);
  }

  // Sort longest first so we match "hey einstein" before "einstein"
  patterns.sort((a, b) => b.length - a.length);
  return patterns;
}

/**
 * Detect a wake word in a transcript and return the remaining question text.
 * Returns null if no wake word is found.
 */
export function detectWakeWord(
  transcript: string,
  tutorId: TutorId
): string | null {
  const normalized = transcript.toLowerCase();
  const patterns = buildWakePatterns(tutorId);

  for (const pattern of patterns) {
    const idx = normalized.indexOf(pattern);
    if (idx !== -1) {
      // Strip the wake word and any leading whitespace from the remainder
      const remainder = transcript.slice(idx + pattern.length).trimStart();
      return remainder;
    }
  }

  return null;
}

export default function useWakeWordListener({
  tutorId,
  isSpeaking,
  onTranscript,
}: UseWakeWordListenerOptions): UseWakeWordListenerReturn {
  const [state, setState] = useState<ListenerState>('IDLE');
  const [wakeWordDetected, setWakeWordDetected] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<ListenerState>('IDLE');
  const onTranscriptRef = useRef(onTranscript);
  const tutorIdRef = useRef(tutorId);

  // Keep refs in sync
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    tutorIdRef.current = tutorId;
  }, [tutorId]);

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const clearTimers = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore — may already be stopped
      }
    }
  }, []);

  const startRecognition = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setState('LISTENING');
    } catch {
      // Already started or not available — schedule retry
      restartTimerRef.current = setTimeout(() => {
        startRecognition();
      }, 1000);
    }
  }, []);

  // Initialize SpeechRecognition instance and wire event handlers
  useEffect(() => {
    if (!tutorId) {
      stopRecognition();
      clearTimers();
      setState('IDLE');
      return;
    }

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionCtor) {
      console.warn('SpeechRecognition not supported in this browser.');
      setState('IDLE');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const currentTutorId = tutorIdRef.current;
      if (!currentTutorId) return;

      // Process results — look for final results containing a wake word
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result.isFinal) continue;

        const transcript = result[0].transcript;
        const question = detectWakeWord(transcript, currentTutorId);

        if (question !== null) {
          // Wake word found
          setWakeWordDetected(true);
          setState('CAPTURING');

          // Flash the wake-word indicator briefly
          setTimeout(() => setWakeWordDetected(false), 1000);

          if (question.trim().length > 0) {
            onTranscriptRef.current(question);
          }

          setState('LISTENING');
        }
        // If no wake word found, discard and continue listening
      }
    };

    recognition.onerror = (event: any) => {
      console.error('SpeechRecognition error:', event.error);
      // Auto-restart after 1 second unless we're paused or idle
      if (stateRef.current !== 'PAUSED' && stateRef.current !== 'IDLE') {
        restartTimerRef.current = setTimeout(() => {
          if (stateRef.current !== 'PAUSED' && stateRef.current !== 'IDLE') {
            startRecognition();
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      // Unexpected end — auto-restart after 1 second unless paused or idle
      if (stateRef.current !== 'PAUSED' && stateRef.current !== 'IDLE') {
        restartTimerRef.current = setTimeout(() => {
          if (stateRef.current !== 'PAUSED' && stateRef.current !== 'IDLE') {
            startRecognition();
          }
        }, 1000);
      }
    };

    // Start listening immediately
    if (!isSpeaking) {
      startRecognition();
    } else {
      setState('PAUSED');
    }

    return () => {
      stopRecognition();
      clearTimers();
      recognitionRef.current = null;
      setState('IDLE');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorId]);

  // Echo cancellation: pause/resume based on isSpeaking
  useEffect(() => {
    if (!tutorId || !recognitionRef.current) return;

    if (isSpeaking) {
      // PAUSED — stop recognition while TTS is playing
      clearTimers();
      stopRecognition();
      setState('PAUSED');
    } else {
      // TTS ended — wait 500ms then resume LISTENING
      if (stateRef.current === 'PAUSED' || stateRef.current === 'RESTARTING') {
        setState('RESTARTING');
        resumeTimerRef.current = setTimeout(() => {
          startRecognition();
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  return {
    isListening: state === 'LISTENING' || state === 'CAPTURING',
    isCapturing: state === 'CAPTURING',
    wakeWordDetected,
  };
}
