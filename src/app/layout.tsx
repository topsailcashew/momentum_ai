
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { FocusProvider } from '@/components/dashboard/focus-provider';
import { FirebaseClientProvider } from '@/firebase';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppProvider } from '@/components/app-layout';
import { AuthProvider } from '@/components/auth-provider';
import { OfflineBanner } from '@/components/offline-banner';
import { WelcomeDialog } from '@/components/onboarding/welcome-dialog';

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
                <FocusProvider>
                  <AppProvider>
                    <OfflineBanner />
                    <WelcomeDialog />
                    {children}
                  </AppProvider>
                </FocusProvider>
              </AuthProvider>
            </FirebaseClientProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
