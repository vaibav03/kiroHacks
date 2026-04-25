'use client';

import Link from 'next/link';
import { useAppContext } from '@/context/AppContext';

export default function Nav() {
  const { pdfValidated, domain } = useAppContext();

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-[#1a1a2e] border-b-4 border-[#4a4a6a] z-50 px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-xl text-white tracking-widest hover:text-yellow-400 transition-colors" style={{ textShadow: '2px 2px 0 #000' }}>STUDY SANCTUM</Link>
      </div>
      
      <div className="flex items-center gap-4">
        {pdfValidated ? (
          <>
            <Link href={`/comic?domain=${domain}`} 
               className="retro-btn px-4 py-2 text-xs">
              COMIC VAULT
            </Link>
            <Link href={`/game?domain=${domain}`} 
               className="retro-btn px-4 py-2 text-xs">
              PUZZLE GAME
            </Link>
          </>
        ) : (
          <>
            <span className="retro-btn px-4 py-2 text-xs opacity-50 cursor-not-allowed !bg-gray-500" title="Upload a PDF to unlock">COMIC VAULT</span>
            <span className="retro-btn px-4 py-2 text-xs opacity-50 cursor-not-allowed !bg-gray-500" title="Upload a PDF to unlock">PUZZLE GAME</span>
          </>
        )}
      </div>
    </nav>
  );
}
