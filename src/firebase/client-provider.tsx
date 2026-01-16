'use client';

import { type ReactNode } from 'react';
import { initializeFirebase, FirebaseProvider } from '@/firebase';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseInstances = initializeFirebase();
  return (
    <FirebaseProvider value={firebaseInstances}>
      {children}
    </FirebaseProvider>
  );
}
