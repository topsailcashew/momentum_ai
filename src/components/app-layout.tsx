'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Gauge,
  PanelLeft,
} from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { open, setOpen } = useSidebar();
  
  React.useEffect(() => {
    // Close sidebar on navigation on mobile
    return () => {
      if (window.innerWidth < 768) {
        setOpen(false);
      }
    };
  }, [pathname, setOpen]);

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Logo className="size-8 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Momentum AI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === '/'}
                tooltip="Dashboard"
              >
                <Link href="/">
                  <>
                    <Gauge />
                    <span>Dashboard</span>
                  </>
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
                  <>
                    <Activity />
                    <span>Analytics</span>
                  </>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="p-4 md:p-6 lg:p-8">
        <header className="flex items-center justify-between md:hidden mb-4">
           <Link href="/" className="flex items-center gap-2">
            <Logo className="size-7 text-primary" />
            <span className="font-semibold font-headline">Momentum AI</span>
          </Link>
          <SidebarTrigger asChild>
             <Button variant="ghost" size="icon">
                <PanelLeft />
             </Button>
          </SidebarTrigger>
        </header>
        {children}
      </SidebarInset>
    </>
  );
}
