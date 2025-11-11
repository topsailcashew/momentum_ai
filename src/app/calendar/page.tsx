
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="text-primary" />
                    Calendar Integration
                </CardTitle>
                <CardDescription>
                    Connect your Google Calendar to sync your events and tasks.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 text-center min-h-[300px]">
                <div className="p-6 rounded-full bg-secondary">
                    <Calendar className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Connect your Calendar</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                    To get started, connect your Google Calendar account. This will allow Momentum AI to display your events and help you schedule tasks.
                </p>
                <Button disabled>
                    Connect Google Calendar (Coming Soon)
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
