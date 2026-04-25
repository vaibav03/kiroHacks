'use client';
import React from 'react';

export default function MozartAvatar({ isSpeaking, amplitude }: { isSpeaking: boolean, amplitude?: number }) {
  const isExcited = amplitude ? amplitude > 30 : false;
  return (
    <div className={`avatar-container ${isSpeaking ? 'speaking' : ''} ${isExcited ? 'excited' : ''}`}>
      <img src="/avatars/mozart.png" alt="Mozart" className="avatar-base" />
      <img src="/avatars/mozart.png" alt="" aria-hidden="true" className="avatar-jaw" />
    </div>
  );
}
