
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Activity, Gauge, PanelLeft, FolderKanban, Sun, Moon, Repeat, CalendarDays, FileText, LogOut, User as UserIcon, Calendar, Church } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
  SidebarFooter,
  SidebarRail,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useUser } from '@/firebase';
import { getAuth, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from './loading-screen';
import { DashboardDataProvider } from '@/hooks/use-dashboard-data';
import { TeamProvider } from '@/hooks/use-team';
import { GlobalMusicPlayer } from '@/components/music/global-music-player';

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpen, isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // Auto-switch theme based on system preference
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    // Set initial theme based on system preference
    handleThemeChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [setTheme]);

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [pathname, isMobile, setOpen]);

  const handleSignOut = async () => {
    const auth = getAuth();
    await signOut(auth);
    toast({ title: "Signed out successfully." });
    router.push('/login');
  };

  if (isUserLoading && !isAuthPage) {
    return <LoadingScreen />;
  }

  if (isAuthPage) {
    return (
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex flex-col items-center justify-center gap-4 bg-secondary/50 p-8 text-center">
          <Link href="/" className="flex flex-col items-center gap-4">
            <Logo className="w-24 h-24 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Pace Pilot</h1>
          </Link>
          <p className="text-muted-foreground">
            The intelligent productivity app to help you find your flow.
          </p>
        </div>
        <div className="flex items-center justify-center p-4">
          {children}
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalMusicPlayer />
      <Sidebar>
        <SidebarRail />
        <SidebarHeader className="pt-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden">Pace Pilot</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          {/* Planning Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Planning</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/'}
                    tooltip="Workday"
                  >
                    <Link href="/">
                      <CalendarDays />
                      <span>Workday</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/weekly-planner'}
                    tooltip="Weekly Planner"
                  >
                    <Link href="/weekly-planner">
                      <Activity />
                      <span>Weekly Planner</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/calendar'}
                    tooltip="Calendar"
                  >
                    <Link href="/calendar">
                      <Calendar />
                      <span>Calendar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Visual Separator */}
          <div className="px-3 py-2">
            <div className="h-px bg-sidebar-border" />
          </div>

          {/* Tasks Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Tasks</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/projects'}
                    tooltip="Projects"
                  >
                    <Link href="/projects">
                      <FolderKanban />
                      <span>Projects</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/ministries')}
                    tooltip="Ministries"
                  >
                    <Link href="/ministries">
                      <Church />
                      <span>Ministries</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/recurring'}
                    tooltip="Recurring"
                  >
                    <Link href="/recurring">
                      <Repeat />
                      <span>Recurring</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Visual Separator */}
          <div className="px-3 py-2">
            <div className="h-px bg-sidebar-border" />
          </div>

          {/* Analytics Section */}
          <SidebarGroup>
            <SidebarGroupLabel>Analytics</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === '/dashboard'}
                    tooltip="Reports"
                  >
                    <Link href="/dashboard">
                      <Gauge />
                      <span>Reports</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="group-data-[collapsible=icon]:size-8 hover:bg-transparent focus-visible:ring-0"
                >
                  <Avatar className="size-full">
                    {user?.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'} />}
                    <AvatarFallback>
                      {user?.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end">
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserIcon />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                  {theme === 'light' ? <Moon /> : <Sun />}
                  <span>Toggle Theme</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold">{user?.displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between md:hidden p-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-7 text-primary" />
            <span className="font-semibold font-headline">Pace Pilot</span>
          </Link>
          <SidebarTrigger>
            <PanelLeft />
          </SidebarTrigger>
        </header>
        <Header />
        <div className="p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}


export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardDataProvider>
        <TeamProvider>
          <AppLayoutContent>
            {children}
          </AppLayoutContent>
        </TeamProvider>
      </DashboardDataProvider>
    </SidebarProvider>
  )
}
