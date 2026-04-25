'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

const SLIDES = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  src: `/comics/slide-${i + 1}.png`,
  alt: `Comic Page ${i + 1}`,
}));

export default function ComicViewer() {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const prev = useCallback(() => {
    setDirection('left');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);
      setIsTransitioning(false);
    }, 200);
  }, []);

  const next = useCallback(() => {
    setDirection('right');
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((c) => (c + 1) % SLIDES.length);
      setIsTransitioning(false);
    }, 200);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'Enter' || e.key === ' ') setLightbox((v) => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [prev, next]);

  const slide = SLIDES[current];

  return (
    <div className="relative w-full max-w-6xl mx-auto px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-yellow-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-transparent" />
      </div>

      {/* Main comic display */}
      <div className="relative">
        {/* Page number indicator */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 retro-panel flex items-center justify-center">
              <span className="text-yellow-400 text-sm font-bold tracking-widest">
                {String(current + 1).padStart(2, '0')}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 tracking-widest uppercase">
              OF {SLIDES.length}
            </div>
          </div>
        </div>

        {/* Comic frame */}
        <div
          className="relative w-full mx-auto cursor-zoom-in group"
          style={{ aspectRatio: '4/3' }}
          onClick={() => setLightbox(true)}
        >
          {/* Frame border */}
          <div className="absolute inset-0 border-8 border-[#2a2a3a] rounded-2xl shadow-2xl shadow-black/50" />
          <div className="absolute inset-4 border-4 border-yellow-400/30 rounded-lg" />

          {/* Comic image with page-turn effect */}
          <div
            className={`relative w-full h-full overflow-hidden rounded-lg transition-all duration-300 ${isTransitioning
              ? direction === 'right'
                ? 'translate-x-4 opacity-80'
                : '-translate-x-4 opacity-80'
              : ''
              }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
              priority={current === 0}
              sizes="(max-width: 768px) 100vw, 1024px"
            />

            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/0 via-transparent to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Hover hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border border-yellow-400/30 px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-yellow-400 text-[10px] tracking-widest flex items-center gap-2">
                <span className="text-lg">🔍</span> CLICK TO ENTER FULLSCREEN MODE
              </span>
            </div>
          </div>

          {/* Page corner curl effect */}
          <div className="absolute top-0 right-0 w-16 h-16">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-yellow-400/20 to-transparent rounded-bl-2xl" />
            <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400/40 rounded-full" />
          </div>
        </div>

        {/* Navigation buttons — styled as retro arcade buttons */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4">
          <button
            onClick={prev}
            className="w-14 h-14 retro-panel flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
            aria-label="Previous page"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/30 group-hover:shadow-yellow-400/50">
                <span className="text-black text-lg font-bold">◀</span>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                PREV
              </div>
            </div>
          </button>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-4">
          <button
            onClick={next}
            className="w-14 h-14 retro-panel flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
            aria-label="Next page"
          >
            <div className="relative">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/30 group-hover:shadow-yellow-400/50">
                <span className="text-black text-lg font-bold">▶</span>
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] text-gray-400 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                NEXT
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Thumbnail carousel */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-6">
          <div className="text-[10px] text-gray-500 tracking-widest uppercase">
            [ PAGE SELECTOR ]
          </div>
          <div className="text-[9px] text-yellow-400/60 tracking-widest">
            CLICK ANY THUMBNAIL TO JUMP
          </div>
        </div>

        <div className="relative">
          {/* Gradient fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#11111a] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#11111a] to-transparent z-10" />

          <div className="flex gap-3 overflow-x-auto py-4 px-8 scrollbar-hide">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                aria-label={`Jump to page ${i + 1}`}
                className="relative flex-shrink-0 group"
              >
                <div
                  className={`relative w-24 h-32 overflow-hidden rounded-lg border-2 transition-all duration-300 ${i === current
                    ? 'border-yellow-400 scale-105 shadow-[0_0_20px_rgba(252,211,77,0.4)]'
                    : 'border-[#4a4a6a] hover:border-yellow-300 hover:scale-102'
                    }`}
                >
                  <Image
                    src={s.src}
                    alt={s.alt}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />

                  {/* Selected indicator */}
                  {i === current && (
                    <div className="absolute inset-0 bg-yellow-400/10 border-2 border-yellow-400/30 rounded-lg" />
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-yellow-400 text-[10px] tracking-widest">
                      GO TO PAGE
                    </span>
                  </div>
                </div>

                {/* Page number badge */}
                <div
                  className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${i === current
                    ? 'bg-yellow-400 text-black'
                    : 'bg-[#4a4a6a] text-gray-300'
                    }`}
                >
                  {i + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-6 retro-panel px-6 py-3">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#2a2a3a] text-yellow-400 text-[10px] rounded border border-[#4a4a6a]">
              ◀
            </kbd>
            <span className="text-[9px] text-gray-400 tracking-widest">PREV PAGE</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#2a2a3a] text-yellow-400 text-[10px] rounded border border-[#4a4a6a]">
              ▶
            </kbd>
            <span className="text-[9px] text-gray-400 tracking-widest">NEXT PAGE</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#2a2a3a] text-yellow-400 text-[10px] rounded border border-[#4a4a6a]">
              SPACE
            </kbd>
            <span className="text-[9px] text-gray-400 tracking-widest">FULLSCREEN</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-[#2a2a3a] text-yellow-400 text-[10px] rounded border border-[#4a4a6a]">
              ESC
            </kbd>
            <span className="text-[9px] text-gray-400 tracking-widest">EXIT</span>
          </div>
        </div>
      </div>

      {/* Lightbox — cinematic fullscreen mode */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          {/* Animated entrance */}
          <div
            className="relative w-full max-w-6xl max-h-[90vh] animate-fade-in"
            style={{ aspectRatio: '4/3' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              className="object-contain"
              sizes="100vw"
            />

            {/* Lightbox controls */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <div className="retro-panel px-4 py-2">
                <span className="text-yellow-400 text-[10px] tracking-widest">
                  PAGE {current + 1} / {SLIDES.length}
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 retro-panel flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Previous"
            >
              <span className="text-yellow-400 text-xl">◀</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 retro-panel flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Next"
            >
              <span className="text-yellow-400 text-xl">▶</span>
            </button>

            <button
              onClick={() => setLightbox(false)}
              className="absolute top-4 right-4 retro-panel px-4 py-2 hover:bg-red-500/20 transition-colors"
              aria-label="Close"
            >
              <span className="text-red-400 text-[10px] tracking-widest flex items-center gap-2">
                <span className="text-lg">✕</span> CLOSE [ESC]
              </span>
            </button>

            {/* Thumbnail strip in lightbox */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrent(i);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${i === current
                      ? 'bg-yellow-400 scale-125'
                      : 'bg-gray-600 hover:bg-yellow-300'
                      }`}
                    aria-label={`Go to page ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
