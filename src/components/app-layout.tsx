'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Gauge, PanelLeft, FolderKanban, Settings, Sun, Moon, Repeat, CalendarDays, FileText } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Logo } from '@/components/logo';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/header';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpen, isMobile } = useSidebar();
  const { setTheme, theme } = useTheme();

  React.useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [pathname, isMobile, setOpen]);
  
  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarRail />
        <SidebarHeader className="pt-6">
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden">Momentum AI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu className="mt-4">
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/'}
                  tooltip="Dashboard"
                >
                  <Link href="/">
                    <Gauge />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
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
                  isActive={pathname === '/recurring'}
                  tooltip="Recurring"
                >
                  <Link href="/recurring">
                    <Repeat />
                    <span>Recurring</span>
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
                    <CalendarDays />
                    <span>Weekly Planner</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/reports'}
                  tooltip="Reports"
                >
                  <Link href="/reports">
                    <FileText />
                    <span>Reports</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/analytics'}
                  tooltip="Analytics"
                >
                  <Link href="/analytics">
                    <Activity />
                    <span>Analytics</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="mt-auto">
             <div className="flex items-center gap-2">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                    variant="ghost"
                    size="icon"
                    >
                    <Settings />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="end">
                    <DropdownMenuItem onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                    {theme === 'light' ? <Moon /> : <Sun />}
                    <span>Toggle Theme</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
                <SidebarTrigger className="ml-auto hidden md:flex" />
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between md:hidden p-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-7 text-primary" />
            <span className="font-semibold font-headline">Momentum AI</span>
          </Link>
          <SidebarTrigger>
            <PanelLeft />
          </SidebarTrigger>
        </header>
        <Header />
        <div className="p-4 md:p-6 lg:p-8">
            {children}
        </div>
      </SidebarInset>
    </>
  );
}
