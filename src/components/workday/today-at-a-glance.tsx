'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Battery, BatteryMedium, BatteryLow, Sparkles } from 'lucide-react';
import { YouTubePlayer } from '@/components/dashboard/youtube-player';
import type { EnergyLevel } from '@/lib/types';
import { useDashboardData } from '@/hooks/use-dashboard-data';

interface TodayAtAGlanceProps {
  currentEnergy: EnergyLevel | null;
  onEnergyChange: (energy: EnergyLevel) => void;
  isTimerActive: boolean;
}

export function TodayAtAGlance({ currentEnergy, onEnergyChange, isTimerActive }: TodayAtAGlanceProps) {
  const { latestMomentum } = useDashboardData();

  const energyOptions = [
    {
      value: 'High' as EnergyLevel,
      icon: Battery,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
      label: 'High',
    },
    {
      value: 'Medium' as EnergyLevel,
      icon: BatteryMedium,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      hoverColor: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
      label: 'Medium',
    },
    {
      value: 'Low' as EnergyLevel,
      icon: BatteryLow,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-900/30',
      label: 'Low',
    },
  ];

  const currentEnergyOption = energyOptions.find(opt => opt.value === currentEnergy);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Today at a Glance</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Energy Controls */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Current Energy</p>
          <div className="flex items-center gap-2">
            {energyOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = currentEnergy === option.value;
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  size="sm"
                  onClick={() => onEnergyChange(option.value)}
                  className={`flex-1 flex flex-col items-center gap-1 h-auto py-2 ${
                    isSelected
                      ? `${option.bgColor} border-2 ${option.color}`
                      : `${option.hoverColor}`
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? option.color : 'text-muted-foreground'}`} />
                  <span className={`text-xs ${isSelected ? 'font-medium' : ''}`}>
                    {option.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* AI Insight */}
        {latestMomentum?.summary && (
          <div className="p-2.5 text-xs rounded-lg bg-muted/50 border border-primary/10">
            <div className="flex items-start gap-2">
              <Sparkles className="size-3.5 shrink-0 mt-0.5 text-primary" />
              <p className="line-clamp-2 text-foreground/80">{latestMomentum.summary}</p>
            </div>
          </div>
        )}

        {/* Music Player */}
        <div className="flex-1">
          <YouTubePlayer isTimerActive={isTimerActive} currentEnergy={currentEnergy} compact={true} />
        </div>
      </CardContent>
    </Card>
  );
}
