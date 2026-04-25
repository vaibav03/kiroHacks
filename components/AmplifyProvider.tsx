'use client';

import { Amplify } from 'aws-amplify';
import { amplifyConfig } from '@/lib/amplify-config';

Amplify.configure(amplifyConfig);

export default function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
