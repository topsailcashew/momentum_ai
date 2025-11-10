'use client';

import * as React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Pomodoro() {
  const [minutes, setMinutes] = React.useState(25);
  const [seconds, setSeconds] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive) {
      interval = setInterval(() => {
        if (seconds > 0) {
          setSeconds((seconds) => seconds - 1);
        }
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(interval!);
            // TODO: Add sound notification
          } else {
            setMinutes((minutes) => minutes - 1);
            setSeconds(59);
          }
        }
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval!);
    }
    return () => clearInterval(interval!);
  }, [isActive, seconds, minutes]);

  const toggle = () => {
    setIsActive(!isActive);
  };

  const reset = () => {
    setIsActive(false);
    setMinutes(25);
    setSeconds(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Pomodoro Timer</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-5xl font-bold font-mono text-primary">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </div>
        <div className="flex gap-2">
          <Button onClick={toggle} size="icon" variant={isActive ? 'secondary' : 'default'}>
            {isActive ? <Pause /> : <Play />}
          </Button>
          <Button onClick={reset} size="icon" variant="outline">
            <RotateCcw />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
