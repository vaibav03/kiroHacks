'use client';
import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function FactsPanel() {
  const { tutorId } = useAppContext();
  const [facts, setFacts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!tutorId) return;

    const fetchFacts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/facts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tutorId }),
        });
        const data = await res.json();
        if (data.facts) {
          setFacts(data.facts);
        }
      } catch (err) {
        console.error("Failed to fetch facts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacts();
  }, [tutorId]);

  return (
    <div className="retro-panel h-full flex flex-col overflow-hidden bg-[#0a0a14]">
      <div className="p-4 border-b-4 border-[#4a4a6a] bg-[#1a1a2e]">
        <h3 className="text-[#fcd34d] text-xs md:text-sm tracking-widest text-center">HISTORICAL DATALOG</h3>
      </div>
      
      <div className="flex-grow overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-[#10b981] animate-pulse">
            <p className="text-xs">SCANNING ARCHIVES...</p>
          </div>
        ) : (
          <div className="space-y-6 relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-2 bottom-2 w-1 bg-[#4a4a6a] z-0"></div>
            
            {facts.map((fact, i) => (
              <div key={i} className="relative z-10 flex gap-4 items-start">
                <div className="w-6 h-6 mt-1 rounded-full bg-[#fcd34d] border-4 border-[#11111a] flex-shrink-0"></div>
                <div className="bg-[#1a1a2e] border-pixel p-4 flex-grow">
                  <p className="text-[#e0e0e0] text-[10px] leading-loose uppercase" style={{fontFamily: 'var(--font-pixel)'}}>{fact}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
