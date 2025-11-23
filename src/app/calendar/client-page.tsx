
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus, MapPin, ExternalLink, Users, AlertCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  htmlLink?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
}

export function CalendarClientPage() {
  const { user } = useUser();
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    if (!user) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/calendar/events?userId=${user.uid}`);

        if (response.status === 404) {
          setError('not_connected');
          return;
        }

        if (response.status === 401) {
          setError('token_expired');
          return;
        }

        const data = await response.json();

        if (response.status === 503 && data.configError) {
          setError('not_configured');
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch calendar events');
        }

        setEvents(data.events || []);
      } catch (err: any) {
        console.error('Error fetching calendar events:', err);
        setError('fetch_failed');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: err.message || 'Failed to load calendar events. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [user, toast]);

  const formatEventTime = (start: string, end: string) => {
    try {
      const startDate = parseISO(start);
      const endDate = parseISO(end);

      // Check if it's an all-day event
      if (start.length === 10) {
        return format(startDate, 'MMM d, yyyy');
      }

      const isSameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

      if (isSameDay) {
        return `${format(startDate, 'MMM d, h:mm a')} - ${format(endDate, 'h:mm a')}`;
      } else {
        return `${format(startDate, 'MMM d, h:mm a')} - ${format(endDate, 'MMM d, h:mm a')}`;
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">View your events and tasks in one place.</p>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error === 'not_connected') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">View your events and tasks in one place.</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 bg-muted/50 rounded-lg">
              <Calendar className="size-16 mb-4" />
              <h3 className="font-semibold text-lg text-foreground">Connect Your Google Calendar</h3>
              <p className="max-w-md mx-auto mt-2 mb-6">
                Connect your Google Calendar to see all your meetings and deadlines right here, alongside your tasks.
              </p>
              <Button onClick={() => router.push('/settings')}>
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === 'token_expired') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">View your events and tasks in one place.</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 bg-muted/50 rounded-lg">
              <AlertCircle className="size-16 mb-4 text-destructive" />
              <h3 className="font-semibold text-lg text-foreground">Calendar Connection Expired</h3>
              <p className="max-w-md mx-auto mt-2 mb-6">
                Your Google Calendar connection has expired. Please reconnect to view your events.
              </p>
              <Button onClick={() => router.push('/settings')}>
                Reconnect Calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === 'not_configured') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-muted-foreground">View your events and tasks in one place.</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 bg-muted/50 rounded-lg">
              <AlertCircle className="size-16 mb-4 text-amber-500" />
              <h3 className="font-semibold text-lg text-foreground">Calendar Not Configured</h3>
              <p className="max-w-md mx-auto mt-2">
                Google Calendar integration requires configuration. The administrator needs to set up Google OAuth credentials in the environment variables.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Missing: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Your upcoming events from Google Calendar</p>
        </div>
      </div>

      {events.length === 0 && error !== 'fetch_failed' ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 bg-muted/50 rounded-lg">
              <Calendar className="size-16 mb-4" />
              <h3 className="font-semibold text-lg text-foreground">No Upcoming Events</h3>
              <p className="max-w-md mx-auto mt-2">
                You don't have any events scheduled in the next 7 days.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : error === 'fetch_failed' ? (
        <Card>
           <CardContent className="pt-6">
             <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 bg-muted/50 rounded-lg">
               <AlertCircle className="size-16 mb-4 text-destructive" />
               <h3 className="font-semibold text-lg text-foreground">Could Not Load Events</h3>
               <p className="max-w-md mx-auto mt-2">
                 There was an error loading your calendar events. Please try again later or check your connection in settings.
               </p>
               <Button onClick={() => router.push('/settings')} className="mt-6">
                Go to Settings
              </Button>
             </div>
           </CardContent>
         </Card>
      ) : (
        <div className="space-y-4">
          {events.map(event => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{event.summary || 'Untitled Event'}</CardTitle>
                    <CardDescription className="mt-1">
                      {formatEventTime(event.start, event.end)}
                    </CardDescription>
                  </div>
                  {event.htmlLink && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-4"
                      onClick={() => window.open(event.htmlLink, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              {(event.description || event.location || event.attendees) && (
                <CardContent className="space-y-3">
                  {event.description && (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-wrap gap-2">
                        {event.attendees.slice(0, 5).map((attendee, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {attendee.displayName || attendee.email}
                          </Badge>
                        ))}
                        {event.attendees.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{event.attendees.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
