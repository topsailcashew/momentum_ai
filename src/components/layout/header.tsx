
'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';

export function Header() {
  const [currentTime, setCurrentTime] = React.useState<Date>(new Date());
  const [mounted, setMounted] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const router = useRouter();
  const { user } = useUser();

  React.useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date()); // Set initial time on client
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/search');
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!user?.displayName) return 'User';
    return user.displayName.split(' ')[0];
  }

  return (
    <header className="hidden md:flex items-center justify-between p-4 md:p-6 lg:p-8 pt-0">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {getFirstName()}!
        </h2>
        <p className="text-muted-foreground" suppressHydrationWarning>
            {mounted ? format(currentTime, 'eeee, MMMM d, yyyy') : format(new Date(), 'eeee, MMMM d, yyyy')}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks, projects..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
         <div className="font-bold bg-muted/50 px-3 py-2 rounded-md text-foreground text-sm" suppressHydrationWarning>
            {mounted ? format(currentTime, 'HH:mm:ss') : format(new Date(), 'HH:mm:ss')}
        </div>
      </div>
    </header>
  );
}
