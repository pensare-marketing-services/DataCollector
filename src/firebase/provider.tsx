'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

interface FirebaseProviderProps {
  children: ReactNode;
  value: {
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
  };
}

export function FirebaseProvider({ children, value }: FirebaseProviderProps) {
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirebaseApp() {
  const context = useFirebase();
  if (context.app === null) {
    throw new Error('Firebase app not available');
  }
  return { app: context.app };
}

export function useAuth() {
  const context = useFirebase();
  if (context.auth === null) {
    throw new Error('Firebase auth not available');
  }
  return { auth: context.auth };
}

export function useFirestore() {
  const context = useFirebase();
  if (context.firestore === null) {
    throw new Error('Firebase firestore not available');
  }
  return { firestore: context.firestore };
}
