
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { PomodoroProvider } from '@/components/dashboard/pomodoro-provider';
import { FirebaseClientProvider } from '@/firebase';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/components/app-layout';
import { AuthProvider } from '@/components/auth-provider';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Pace Pilot',
  description: 'Your personal dashboard for productivity and focus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <FirebaseClientProvider>
              <AuthProvider>
                <PomodoroProvider>
                  <AppProvider>
                    {children}
                  </AppProvider>
                </PomodoroProvider>
              </AuthProvider>
            </FirebaseClientProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
