'use client';

import { Logo } from '@/components/logo';

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <div className="relative">
        <Logo className="h-32 w-32 text-primary animate-pulse" />
      </div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}
