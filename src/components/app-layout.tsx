'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Gauge, PanelLeft, FolderKanban, Settings, Sun, Moon } from 'lucide-react';
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
        <SidebarFooter className="mt-auto flex items-center gap-2">
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
            <SidebarTrigger className="hidden md:flex" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4 md:p-6 lg:p-8">
        <header className="flex items-center justify-between md:hidden mb-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="size-7 text-primary" />
            <span className="font-semibold font-headline">Momentum AI</span>
          </Link>
          <SidebarTrigger>
            <PanelLeft />
          </SidebarTrigger>
        </header>
        {children}
      </SidebarInset>
    </>
  );
}
