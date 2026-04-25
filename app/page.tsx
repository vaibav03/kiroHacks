'use client';

import { TUTORS } from '@/lib/tutors';
import DomainCard from '@/components/DomainCard';
import TutorPage from '@/components/TutorPage';
import { useAppContext } from '@/context/AppContext';

export default function Home() {
  const { domain } = useAppContext();

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col items-center justify-center w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl text-white mb-8 leading-tight tracking-widest" style={{ textShadow: '4px 4px 0 #000' }}>
            HISTORIA
          </h1>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-loose uppercase">
            MEET YOUR AI ASSISTANT.<br/><br/>SELECT A MISSION OR REVIEW YOUR PROGRESS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
          {Object.values(TUTORS).map((tutor) => (
            <DomainCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      </section>

      <section id="tutor-section" className="w-full">
        {domain ? (
          <TutorPage />
        ) : (
          <div className="retro-panel p-10 text-center text-gray-400 text-sm uppercase leading-relaxed">
            [ AWAITING MISSION SELECTION ]
          </div>
        )}
      </section>
    </div>
  );
}
