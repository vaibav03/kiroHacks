export type TutorId = 'einstein' | 'lincoln' | 'mozart' | 'shakespeare';
export type Domain = 'theoretical-physics' | 'civil-war-presidency' | 'classical-music' | 'elizabethan-literature';

export interface TutorConfig {
  id: TutorId;
  name: string;
  domain: Domain;
  domainTitle: string;
  voiceId: string;
  accentColor: string;
}

export const TUTORS: Record<TutorId, TutorConfig> = {
  einstein: {
    id: 'einstein',
    name: 'Albert Einstein',
    domain: 'theoretical-physics',
    domainTitle: 'Theoretical Physics',
    voiceId: 'Matthew',
    accentColor: '#1e3a8a', // blue-900
  },
  lincoln: {
    id: 'lincoln',
    name: 'Abraham Lincoln',
    domain: 'civil-war-presidency',
    domainTitle: 'American Civil War and Presidency',
    voiceId: 'Joey',
    accentColor: '#78350f', // amber-900 (sepia/red)
  },
  mozart: {
    id: 'mozart',
    name: 'Wolfgang Amadeus Mozart',
    domain: 'classical-music',
    domainTitle: 'Classical Music Composition',
    voiceId: 'Kevin',
    accentColor: '#b45309', // amber-700 (gold)
  },
  shakespeare: {
    id: 'shakespeare',
    name: 'William Shakespeare',
    domain: 'elizabethan-literature',
    domainTitle: 'English Literature and Elizabethan Drama',
    voiceId: 'Brian',
    accentColor: '#14532d', // green-900
  }
};

export const DOMAINS = Object.values(TUTORS).map(t => t.domain);
