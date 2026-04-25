'use client';
import React, { useRef, useEffect } from 'react';

export default function EinsteinAvatar({ isSpeaking, amplitude }: { isSpeaking: boolean, amplitude?: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isSpeaking) {
        videoRef.current.play().catch(e => console.error("Video play failed:", e));
      } else {
        videoRef.current.pause();
        // Reset to first frame so he isn't frozen mid-word
        videoRef.current.currentTime = 0; 
      }
    }
  }, [isSpeaking]);

  return (
    <div className="w-full max-w-sm aspect-square overflow-hidden border-4 border-pixel border-[#4a4a6a] rounded-xl flex items-center justify-center bg-black shadow-[0_0_20px_rgba(252,211,77,0.2)]">
      <video 
        ref={videoRef}
        src="/avatars/einstein.mp4" 
        className="w-full h-full object-contain"
        loop
        muted
        playsInline
      />
    </div>
  );
}
