'use client';

import { Logo } from '@/components/logo';

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <div className="flex items-center gap-4">
        <Logo className="size-16 animate-bounce-slow text-primary" />
        <span className="text-3xl font-bold">Loading...</span>
      </div>
    </div>
  );
}
