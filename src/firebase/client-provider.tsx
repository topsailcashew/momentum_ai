'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { LoadingScreen } from '@/components/loading-screen';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize Firebase on the client side, once per component mount.
    try {
        setFirebaseServices(initializeFirebase());
    } finally {
        setIsInitializing(false);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  if (isInitializing) {
    // Render the loading screen while Firebase is initializing
    return <LoadingScreen />;
  }
  
  if (!firebaseServices) {
    // This case could happen if initialization fails catastrophically.
    // You could render a dedicated error page here.
    return <div>Could not initialize Firebase.</div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
