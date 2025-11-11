'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/firebase';

export function Header() {
  const [currentTime, setCurrentTime] = React.useState<Date>(new Date());
  const [mounted, setMounted] = React.useState(false);
  const { user } = useUser();

  React.useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date()); // Set initial time on client
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="hidden md:flex items-center justify-between p-4 md:p-6 lg:p-8 pt-0">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
          <span suppressHydrationWarning>
              {mounted ? format(currentTime, 'eeee, MMMM d') : format(new Date(), 'eeee, MMMM d')}
          </span>
          <span className="font-bold bg-muted/50 px-2 py-1 rounded-md text-foreground text-xs" suppressHydrationWarning>
              {mounted ? format(currentTime, 'h:mm:ss a') : format(new Date(), 'h:mm:ss a')}
          </span>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <Avatar>
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback>
                {user?.displayName?.charAt(0) || 'U'}
            </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
