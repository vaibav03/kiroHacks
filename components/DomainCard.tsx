'use client';

import { TutorConfig } from '@/lib/tutors';
import { useAppContext } from '@/context/AppContext';

export default function DomainCard({ tutor }: { tutor: TutorConfig }) {
  const { setSession } = useAppContext();

  const handleSelect = () => {
    setSession(tutor.domain, tutor.id);
    document.getElementById('tutor-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="retro-panel p-6 flex flex-col items-center text-center">
      <div className="w-24 h-24 mb-6 border-4 border-black" style={{ backgroundColor: tutor.accentColor }}>
        <div className="w-full h-full flex items-center justify-center text-black font-bold text-4xl shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.3)]">
          {tutor.name.charAt(0)}
        </div>
      </div>
      <h3 className="text-white text-sm leading-relaxed mb-6">{tutor.domainTitle}</h3>
      <button 
        onClick={handleSelect}
        className="retro-btn w-full py-3 mt-auto"
      >
        EQUIP
      </button>
    </div>
  );
}
