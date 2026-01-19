'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useFirebaseAuth } from '@/firebase';
import { signInAnonymously, signOut } from 'firebase/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const firebaseAuth = useFirebaseAuth();

  useEffect(() => {
    // Check sessionStorage on initial load to maintain "logged in" state on refresh
    const storedAuth = sessionStorage.getItem('isAdminAuthenticated');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      // It's crucial to also ensure we have a firebase session on refresh
      if (!firebaseAuth.currentUser) {
          signInAnonymously(firebaseAuth);
      }
    }
  }, [firebaseAuth]);

  const login = async (username, password) => {
    if (username === 'admin' && password === 'admin') {
      try {
        await signInAnonymously(firebaseAuth);
        sessionStorage.setItem('isAdminAuthenticated', 'true');
        setIsAuthenticated(true);
        return true;
      } catch (e) {
        console.error("Admin login failed during Firebase sign-in:", e);
        return false;
      }
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('isAdminAuthenticated');
    setIsAuthenticated(false);
    signOut(firebaseAuth); // This clears the anonymous Firebase session
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
