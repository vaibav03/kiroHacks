'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppContext } from '@/context/AppContext';
import { GameModule } from '@/components/GameModule/GameModule';
import {
  lincolnSlots,
  lincolnPanels,
  GRID_WIDTH,
  GRID_HEIGHT,
} from '@/components/GameModule/lincolnData';

const DOMAIN_TITLES: Record<string, string> = {
  'civil-war-presidency': "Lincoln's Legacy Quest",
  'theoretical-physics': "Einstein's Discovery Quest",
  'classical-music': "Mozart's Composition Quest",
  'elizabethan-literature': "Shakespeare's Word Quest",
};

function GamePageContent() {
  const searchParams = useSearchParams();
  const urlDomain = searchParams.get('domain');
  const { pdfValidated, domain: ctxDomain } = useAppContext();

  const activeDomain = urlDomain ?? ctxDomain ?? '';
  const lessonTitle = DOMAIN_TITLES[activeDomain] ?? 'Historical Quest';

  return (
    <GameModule
      isUnlocked={pdfValidated}
      slots={lincolnSlots}
      panels={lincolnPanels}
      gridWidth={GRID_WIDTH}
      gridHeight={GRID_HEIGHT}
      lessonTitle={lessonTitle}
      pdfFilename="uploaded-chapter.pdf"
      studentName="Student"
      onWordSolved={(slotId) => console.log('Solved:', slotId)}
    />
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading game…</div>}>
      <GamePageContent />
    </Suspense>
  );
}
