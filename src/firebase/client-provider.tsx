'use client';

import React, { ReactNode, useEffect } from 'react';
import { initializeFirebase } from './config';
import { FirebaseProvider } from './provider';
import { getRedirectResult } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { doc, setDoc, writeBatch } from 'firebase/firestore';

// This provider is for the client-side, ensuring Firebase is initialized once.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const firebaseContext = initializeFirebase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(firebaseContext.auth);
        if (result?.user) {
          // User successfully signed in with Google
          console.log('Google Sign-In successful:', result.user.email);

          // Check if this is a new user and create sample data if on signup page
          const isSignupFlow = pathname === '/signup';

          if (isSignupFlow) {
            // Create user profile and sample data
            const userRef = doc(firebaseContext.firestore, 'users', result.user.uid);
            await setDoc(userRef, {
              displayName: result.user.displayName,
              email: result.user.email,
              photoURL: result.user.photoURL,
            }, { merge: true });

            // Create sample data
            await createSampleData(result.user.uid, firebaseContext.firestore);
          }

          // Redirect to dashboard
          router.push('/');
        }
      } catch (error: any) {
        console.error('Error handling redirect result:', error);
        // Don't show error toast here as it might be a normal "no redirect result" scenario
      }
    };

    handleRedirectResult();
  }, [firebaseContext.auth, firebaseContext.firestore, router, pathname]);

  return <FirebaseProvider value={firebaseContext}>{children}</FirebaseProvider>;
}

// Helper function to create sample data for new users
async function createSampleData(userId: string, firestore: any) {
  const batch = writeBatch(firestore);

  // Sample Projects
  const projects = [
    { id: 'q1-product-launch', name: 'Q1 Product Launch', priority: 'High' },
    { id: 'website-redesign', name: 'Website Redesign', priority: 'Medium' },
    { id: 'personal-fitness', name: 'Personal Fitness', priority: 'Low' },
  ];

  projects.forEach(project => {
    const projectRef = doc(firestore, `users/${userId}/projects`, project.id);
    batch.set(projectRef, { name: project.name, priority: project.priority });
  });

  // Sample Tasks
  const tasks = [
    // Tasks for Q1 Product Launch
    { name: 'Finalize marketing brief', energyLevel: 'Medium', category: 'work', projectId: 'q1-product-launch', deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), effort: 2, focusType: 'Analytical', priority: 'Urgent & Important' },
    { name: 'Design promotional graphics', energyLevel: 'High', category: 'work', projectId: 'q1-product-launch', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), effort: 3, focusType: 'Creative', priority: 'Important & Not Urgent' },
    { name: 'Coordinate with PR agency', energyLevel: 'Low', category: 'work', projectId: 'q1-product-launch', effort: 1, focusType: 'Administrative' },
    // Tasks for Website Redesign
    { name: 'Gather user feedback on current site', energyLevel: 'Medium', category: 'work', projectId: 'website-redesign', deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), effort: 2, focusType: 'Analytical' },
    { name: 'Create wireframes for new homepage', energyLevel: 'High', category: 'work', projectId: 'website-redesign', priority: 'Important & Not Urgent' },
    // Tasks for Personal Fitness
    { name: 'Go for a 30-minute run', energyLevel: 'High', category: 'health', projectId: 'personal-fitness', focusType: 'Physical' },
    { name: 'Meal prep for the week', energyLevel: 'Medium', category: 'health', projectId: 'personal-fitness', deadline: new Date().toISOString(), effort: 3 },
    // Uncategorized Tasks
    { name: 'Book dentist appointment', energyLevel: 'Low', category: 'personal', priority: 'Urgent & Not Important' },
    { name: 'Read a chapter of a book', energyLevel: 'Low', category: 'learning' },
    { name: 'Clean the kitchen', energyLevel: 'Medium', category: 'chore', effort: 2 },
  ];

  tasks.forEach(task => {
    const taskRef = doc(firestore, `users/${userId}/tasks`, Math.random().toString(36).substring(2));
    batch.set(taskRef, {
      ...task,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
    });
  });

  await batch.commit();
}
