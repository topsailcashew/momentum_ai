'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { LoadingScreen } from './loading-screen';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  React.useEffect(() => {
    if (!isUserLoading && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [isUserLoading, user, isAuthPage, router]);

  if (isUserLoading && !isAuthPage) {
    return <LoadingScreen />;
  }
  
  if (!user && !isAuthPage) {
      return <LoadingScreen />; // Show loading screen while redirecting
  }

  return <>{children}</>;
}