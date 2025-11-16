'use client';

import { Logo } from '@/components/logo';

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <h1 className="text-4xl font-bold font-headline text-primary animate-pulse">Momentum AI</h1>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
