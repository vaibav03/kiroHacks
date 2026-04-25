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
  onStopAudio 
}: { 
  onTTSFetch: (text: string) => void,
  isSpeaking?: boolean,
  onStopAudio?: () => void
}) {
  const { tutorId, sessionId } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsRecording(false);
          // Automatically submit after voice recognition
          setTimeout(() => submitMessage(transcript), 100);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const submitMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    // If the user speaks while avatar is talking, cut off the avatar!
    if (isSpeaking && onStopAudio) {
      onStopAudio();
    }

    const newMsg: Message = { id: crypto.randomUUID(), role: 'user', text: messageText };
    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, tutorId, sessionId })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'tutor',
        text: data.message,
        citations: data.citations
      }]);

      // Strip out stage directions (e.g., *coughs*) and citations before sending to TTS
      const textForTTS = data.message
        .replace(/\*[^*]+\*/g, '')
        .replace(/\[Citation \d+\]/gi, '')
        .trim();
      onTTSFetch(textForTTS);

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'tutor', text: "SYSTEM ERROR: COMM LINK FAILED" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    submitMessage(input);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // If user starts talking, stop the avatar!
      if (isSpeaking && onStopAudio) {
        onStopAudio();
      }
      setInput('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col h-full retro-panel overflow-hidden">
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-[#0a0a14]">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
            <p className="animate-pulse">_ AWAITING INPUT _</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] border-pixel p-4 ${msg.role === 'user' ? 'bg-[#2d2a26] text-white' : 'bg-[#e0e0e0] text-black'}`}>
              <p className="whitespace-pre-wrap leading-loose text-xs uppercase font-sans" style={{fontFamily: 'var(--font-pixel)'}}>{msg.text}</p>
              
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-black/20">
                  <p className="text-[10px] font-bold mb-2">SOURCES:</p>
                  <ul className="text-[10px] space-y-2">
                    {msg.citations.map(cit => (
                      <li key={cit.id} className="flex gap-2">
                        <span>[{cit.id}]</span> 
                        <a href={cit.url} target="_blank" rel="noreferrer" className="underline hover:text-blue-600">
                          {cit.source}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#e0e0e0] text-black border-pixel p-4 text-xs animate-pulse">
              PROCESSING...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#1a1a2e] border-t-4 border-[#4a4a6a]">
        <form onSubmit={handleSubmit} className="flex gap-4 relative">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="ENTER COMMAND..."
            disabled={isLoading || isRecording}
            className="flex-grow p-4 bg-[#0a0a14] text-[#fcd34d] border-4 border-[#4a4a6a] focus:outline-none focus:border-[#fcd34d] disabled:opacity-50 text-xs"
          />
          <button 
            type="button"
            onClick={toggleRecording}
            disabled={isLoading || isSpeaking}
            className={`retro-btn px-4 flex items-center justify-center ${isRecording ? '!bg-red-500 !text-white animate-pulse' : ''}`}
            title="START/STOP MIC"
          >
            MIC
          </button>
          <button 
            type="button"
            onClick={() => {
              if (isRecording) toggleRecording();
              if (isSpeaking && onStopAudio) onStopAudio();
            }}
            disabled={!isSpeaking && !isRecording}
            className={`retro-btn px-4 flex items-center justify-center ${(isSpeaking || isRecording) ? '!bg-red-600 !text-white' : 'opacity-50'}`}
            title="STOP EVERYTHING"
          >
            STOP
          </button>
          <button 
            type="submit"
            disabled={isLoading || isRecording || (!input.trim() && !isRecording)}
            className="retro-btn px-6"
          >
            SEND
          </button>
        </form>
      </div>
    </div>
  );
}
