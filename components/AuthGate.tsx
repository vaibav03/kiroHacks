'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator
      signUpAttributes={['email']}
      components={{
        Header() {
          return (
            <div style={{ textAlign: 'center', padding: '2rem 0 1rem' }}>
              <h1 style={{
                fontSize: '2rem',
                color: '#fcd34d',
                letterSpacing: '0.2em',
                textShadow: '3px 3px 0 #000',
              }}>
                HISTORIA
              </h1>
              <p style={{
                fontSize: '0.7rem',
                color: '#9ca3af',
                letterSpacing: '0.15em',
                marginTop: '0.5rem',
              }}>
                AUTHENTICATE TO ACCESS MISSIONS
              </p>
            </div>
          );
        },
      }}
    >
      {({ signOut, user }) => <>{children}</>}
    </Authenticator>
  );
}
