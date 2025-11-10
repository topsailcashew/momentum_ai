'use client';

import * as React from 'react';
import { Search, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

export function Header() {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="hidden md:flex items-center justify-between">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" />
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <CalendarDays className="h-5 w-5" />
        <span>{format(currentTime, 'eeee, MMMM d, yyyy h:mm:ss a')}</span>
      </div>
    </header>
  );
}
