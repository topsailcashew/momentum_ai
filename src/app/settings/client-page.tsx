'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Calendar, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface CalendarStatus {
  connected: boolean;
  hasRefreshToken?: boolean;
  isExpired?: boolean;
  connectedAt?: string;
}

export function SettingsClientPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [calendarStatus, setCalendarStatus] = React.useState<CalendarStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  // Check for OAuth callback status
  React.useEffect(() => {
    const status = searchParams.get('status');
    const message = searchParams.get('message');

    if (status === 'success') {
      toast({
        title: 'Calendar Connected!',
        description: 'Your Google Calendar has been successfully connected.',
      });
      // Remove query params from URL
      router.replace('/settings');
    } else if (status === 'error') {
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: message === 'missing_user' ? 'User authentication failed.' : 'Failed to connect Google Calendar. Please try again.',
      });
      // Remove query params from URL
      router.replace('/settings');
    }
  }, [searchParams, router]);

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Fetch calendar connection status
  React.useEffect(() => {
    if (!user?.uid) return;

    const fetchStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const response = await fetch(`/api/calendar/status?userId=${user.uid}`);
        if (response.ok) {
          const data = await response.json();
          setCalendarStatus(data);
        }
      } catch (error) {
        console.error('Error fetching calendar status:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [user]);

  const handleConnectCalendar = async () => {
    if (!user?.uid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User not authenticated. Please log in again.',
      });
      return;
    }

    setIsConnecting(true);
    try {
        const response = await fetch(`/api/auth/google?userId=${user.uid}`);
        const data = await response.json();

        if (response.status === 503 && data.configError) {
          toast({
            variant: 'destructive',
            title: 'Not Configured',
            description: 'Google Calendar integration is not configured. Please contact the administrator.',
          });
          setIsConnecting(false);
          return;
        }

        if (response.ok) {
            // Redirect the user to Google's OAuth consent screen
            window.location.href = data.authUrl;
        } else {
            throw new Error(data.error || 'Failed to get authorization URL.');
        }
    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: error.message || 'Could not initiate connection to Google Calendar. Please try again.',
        });
        setIsConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user?.uid) return;

    setIsDisconnecting(true);
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (response.ok) {
        setCalendarStatus({ connected: false });
        toast({
          title: 'Calendar Disconnected',
          description: 'Your Google Calendar has been disconnected.',
        });
      } else {
        throw new Error('Failed to disconnect calendar');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Disconnection Failed',
        description: 'Could not disconnect Google Calendar. Please try again.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const getStatusDisplay = () => {
    if (isLoadingStatus) {
      return <Skeleton className="h-4 w-24" />;
    }

    if (!calendarStatus?.connected) {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Not connected</span>
        </div>
      );
    }

    if (calendarStatus.isExpired) {
      return (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-amber-600">Connection expired</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <Badge variant="outline" className="text-green-600 border-green-600">Connected</Badge>
        </div>
        {calendarStatus.connectedAt && (
          <span className="text-xs text-muted-foreground">
            Since {format(parseISO(calendarStatus.connectedAt), 'MMM d, yyyy')}
          </span>
        )}
      </div>
    );
  };

  const getActionButton = () => {
    if (isLoadingStatus) {
      return <Skeleton className="h-10 w-24" />;
    }

    if (!calendarStatus?.connected) {
      return (
        <Button onClick={handleConnectCalendar} disabled={isConnecting}>
          {isConnecting ? 'Connecting...' : 'Connect'}
        </Button>
      );
    }

    if (calendarStatus.isExpired) {
      return (
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDisconnectCalendar} disabled={isDisconnecting}>
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Button>
          <Button onClick={handleConnectCalendar} disabled={isConnecting}>
            {isConnecting ? 'Reconnecting...' : 'Reconnect'}
          </Button>
        </div>
      );
    }

    return (
      <Button variant="outline" onClick={handleDisconnectCalendar} disabled={isDisconnecting}>
        {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings and integrations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect Momentum AI with other services.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <Calendar className="size-6 text-primary" />
              <div>
                <h3 className="font-semibold">Google Calendar</h3>
                {getStatusDisplay()}
              </div>
            </div>
            {getActionButton()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
