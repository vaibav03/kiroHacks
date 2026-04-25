'use client';
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { TUTORS } from '@/lib/tutors';
import EinsteinAvatar from './avatars/EinsteinAvatar';
import LincolnAvatar from './avatars/LincolnAvatar';
import MozartAvatar from './avatars/MozartAvatar';
import ShakespeareAvatar from './avatars/ShakespeareAvatar';
import ChatPanel from './ChatPanel';
import PdfUpload from './PdfUpload';
import AudioPlayer from './AudioPlayer';
import FactsPanel from './FactsPanel';

export default function TutorPage() {
  const { tutorId } = useAppContext();
  const [audioBuffer, setAudioBuffer] = useState<Uint8Array | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [amplitude, setAmplitude] = useState(0);

  if (!tutorId) return null;
  const tutorConfig = TUTORS[tutorId];

  const fetchTTS = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tutorId })
      });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        setAudioBuffer(new Uint8Array(arrayBuffer));
      }
    } catch (err) {
      console.error("TTS fetch failed", err);
    }
  };

  const renderAvatar = () => {
    const isMouthMoving = isSpeaking && amplitude > 10;
    switch (tutorId) {
      case 'einstein': return <EinsteinAvatar isSpeaking={isMouthMoving} amplitude={amplitude} />;
      case 'lincoln': return <LincolnAvatar isSpeaking={isMouthMoving} amplitude={amplitude} />;
      case 'mozart': return <MozartAvatar isSpeaking={isMouthMoving} amplitude={amplitude} />;
      case 'shakespeare': return <ShakespeareAvatar isSpeaking={isMouthMoving} amplitude={amplitude} />;
      default: return null;
    }
  };

  const stopAudio = () => {
    setAudioBuffer(null);
    setIsSpeaking(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[80vh] gap-8 w-full">
      {/* Left Column: Avatar (Top) and Chat (Bottom) */}
      <div className="w-full lg:w-[45%] flex flex-col gap-6 h-[80vh] lg:h-full">
        <div className="flex gap-4 h-[40%]">
          <div className="w-1/2 flex items-center justify-center">
            {renderAvatar()}
          </div>
          <div className="w-1/2 flex flex-col gap-4">
            <div className="retro-panel p-4 text-center bg-[#0a0a14] flex flex-col justify-center flex-grow">
              <h2 className="text-xs md:text-sm text-white tracking-widest leading-loose">{tutorConfig.name}</h2>
              <p className="text-[10px] text-[#10b981] mt-2 uppercase animate-pulse">STATUS: ONLINE</p>
            </div>
            <div className="flex-grow">
              <PdfUpload />
            </div>
          </div>
        </div>

        {/* Chat Panel at the bottom left */}
        <div className="flex-grow h-[60%] overflow-hidden">
          <ChatPanel onTTSFetch={fetchTTS} isSpeaking={isSpeaking} onStopAudio={stopAudio} />
        </div>
      </div>

      {/* Right Column: Timeline / Facts */}
      <div className="w-full lg:w-[55%] h-[80vh] lg:h-full">
        <FactsPanel />
      </div>

      <AudioPlayer 
        audioBuffer={audioBuffer} 
        onPlaybackStart={() => setIsSpeaking(true)} 
        onPlaybackEnd={() => { setIsSpeaking(false); setAudioBuffer(null); }}
        onAmplitudeUpdate={setAmplitude}
      />
    </div>
  );
}
