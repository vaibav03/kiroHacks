'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

interface Message {
  id: string;
  role: 'user' | 'tutor';
  text: string;
  citations?: Array<{ id: number; source: string; year: string; url: string }>;
}

export default function ChatPanel({ 
  onTTSFetch, 
  isSpeaking, 
  onStopAudio,
}: { 
  onTTSFetch: (text: string) => void;
  isSpeaking?: boolean;
  onStopAudio?: () => void;
}) {
  const { tutorId, sessionId } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const pendingTranscriptRef = useRef('');

  // Clear chat on tutor change
  useEffect(() => {
    setMessages([]);
    setInput('');
  }, [tutorId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init speech recognition once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let fullText = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          fullText += event.results[i][0].transcript + ' ';
        }
      }
      fullText = fullText.trim();
      if (fullText) {
        pendingTranscriptRef.current = fullText;
        setInput(fullText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      // Don't auto-restart — user controls start/stop
    };

    recognitionRef.current = recognition;
  }, []);

  // Submit message to chat API
  const submitMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newMsg: Message = { id: crypto.randomUUID(), role: 'user', text: messageText };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    pendingTranscriptRef.current = '';
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, tutorId, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'tutor',
        text: data.message,
        citations: data.citations,
      }]);

      // TTS — strip stage directions and citation tags
      const ttsText = data.message
        .replace(/\*[^*]+\*/g, '')
        .replace(/\[Citation \d+\]/gi, '')
        .trim();
      onTTSFetch(ttsText);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'tutor', text: 'SYSTEM ERROR: COMM LINK FAILED',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Button handlers ──

  // MIC: start recording
  const handleMic = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition is not supported in this browser.');
      return;
    }
    setInput('');
    pendingTranscriptRef.current = '';
    try { recognitionRef.current.start(); } catch {}
    setIsRecording(true);
  };

  // STOP: stop recording → auto-send transcript
  const handleStop = () => {
    if (!recognitionRef.current) return;
    try { recognitionRef.current.stop(); } catch {}
    setIsRecording(false);

    // Small delay to let the final onresult fire
    setTimeout(() => {
      const text = pendingTranscriptRef.current || input;
      if (text.trim()) {
        submitMessage(text);
      }
    }, 300);
  };

  // MUTE: silence the tutor mid-speech
  const handleMute = () => {
    if (onStopAudio) onStopAudio();
  };

  // SEND: submit typed text
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    submitMessage(input);
  };

  return (
    <div className="flex flex-col h-full retro-panel overflow-hidden">
      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-[#0a0a14]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
            <p className="animate-pulse">_ AWAITING INPUT _</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] border-pixel p-4 ${msg.role === 'user' ? 'bg-[#2d2a26] text-white' : 'bg-[#e0e0e0] text-black'}`}>
              <p className="whitespace-pre-wrap leading-loose text-xs uppercase font-sans" style={{ fontFamily: 'var(--font-pixel)' }}>
                {msg.text.replace(/\[Citation \d+\]/gi, '').trim()}
              </p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/20">
                  <p className="text-[10px] font-bold mb-2">SOURCE:</p>
                  <a href={msg.citations[0].url} target="_blank" rel="noreferrer" className="text-[10px] underline hover:text-blue-600">
                    {msg.citations[0].source}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#e0e0e0] text-black border-pixel p-4 text-xs animate-pulse">PROCESSING...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-4 bg-[#1a1a2e] border-t-4 border-[#4a4a6a]">
        {isRecording && (
          <div className="flex items-center gap-2 mb-2 text-[10px] text-red-400 uppercase tracking-widest animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500" />
            RECORDING... PRESS STOP WHEN DONE
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isRecording ? 'LISTENING...' : 'ENTER COMMAND...'}
            disabled={isLoading || isRecording}
            className="flex-grow p-4 bg-[#0a0a14] text-[#fcd34d] border-4 border-[#4a4a6a] focus:outline-none focus:border-[#fcd34d] disabled:opacity-50 text-xs"
          />

          {/* MIC — start voice recording */}
          <button
            type="button"
            onClick={handleMic}
            disabled={isLoading || isRecording}
            className={`retro-btn px-3 flex items-center justify-center gap-1 text-xs ${isRecording ? 'opacity-50' : ''}`}
          >
            🎤 MIC
          </button>

          {/* STOP — stop recording + send to agent */}
          <button
            type="button"
            onClick={handleStop}
            disabled={!isRecording}
            className={`retro-btn px-3 flex items-center justify-center gap-1 text-xs ${isRecording ? '!bg-red-600 !text-white animate-pulse' : 'opacity-50'}`}
          >
            ⏹ STOP
          </button>

          {/* MUTE — silence tutor voice */}
          <button
            type="button"
            onClick={handleMute}
            disabled={!isSpeaking}
            className={`retro-btn px-3 flex items-center justify-center gap-1 text-xs ${isSpeaking ? '!bg-orange-600 !text-white' : 'opacity-50'}`}
          >
            🔇 MUTE
          </button>

          {/* SEND — submit typed text */}
          <button
            type="submit"
            disabled={isLoading || isRecording || !input.trim()}
            className="retro-btn px-5 text-xs"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
