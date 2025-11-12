'use client';

import { Logo } from '@/components/logo';

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-gradient-animation">
      <div className="flex items-center gap-4 text-primary-foreground/80">
        <Logo className="size-12" />
        <div className="flex flex-col">
            <span className="text-3xl font-bold font-headline tracking-tight">Momentum AI</span>
            <span className="text-sm">Loading...</span>
        </div>
      </div>
    </div>
  );
}
