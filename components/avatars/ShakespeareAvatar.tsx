'use client';
import React from 'react';

export default function ShakespeareAvatar({ isSpeaking, amplitude }: { isSpeaking: boolean, amplitude?: number }) {
  const isExcited = amplitude ? amplitude > 30 : false;
  return (
    <div className={`avatar-container ${isSpeaking ? 'speaking' : ''} ${isExcited ? 'excited' : ''}`}>
      <img src="/avatars/shakespeare.png" alt="Shakespeare" className="avatar-base" />
      <img src="/avatars/shakespeare.png" alt="" aria-hidden="true" className="avatar-jaw" />
    </div>
  );
}
