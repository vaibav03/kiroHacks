'use client';

import React, { createContext, useContext, useState } from 'react';
import { TutorId, Domain } from '@/lib/tutors';

interface AppState {
  sessionId: string | null;
  domain: Domain | null;
  tutorId: TutorId | null;
  pdfValidated: boolean;
  setSession: (domain: Domain, tutorId: TutorId) => void;
  setPdfValidated: (val: boolean) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [tutorId, setTutorId] = useState<TutorId | null>(null);
  const [pdfValidated, setPdfValidated] = useState<boolean>(false);

  const setSession = (newDomain: Domain, newTutorId: TutorId) => {
    const id = crypto.randomUUID();
    setSessionId(id);
    setDomain(newDomain);
    setTutorId(newTutorId);
    setPdfValidated(false);

    const sessionData = { sessionId: id, domain: newDomain, tutorId: newTutorId, pdfValidated: false };
    
    fetch(`/api/session/${id}`, {
      method: 'POST',
      body: JSON.stringify(sessionData)
    }).catch(console.error);
  };

  const updatePdfValidated = (val: boolean) => {
    setPdfValidated(val);
    if (sessionId) {
      const sessionData = { sessionId, domain, tutorId, pdfValidated: val };
      
      fetch(`/api/session/${sessionId}`, {
        method: 'POST',
        body: JSON.stringify(sessionData)
      }).catch(console.error);
    }
  };

  return (
    <AppContext.Provider value={{ sessionId, domain, tutorId, pdfValidated, setSession, setPdfValidated: updatePdfValidated }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
