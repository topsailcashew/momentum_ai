
'use client';

import * as React from 'react';
import { format, isToday, parseISO } from 'date-fns';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { DailyReport } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DateCardProps {
  report: DailyReport;
  isSelected: boolean;
  onSelect: () => void;
}

export function DateCard({ report, isSelected, onSelect }: DateCardProps) {
  const completionRate = report.goals > 0 ? (report.completed / report.goals) * 100 : 0;
  const isReportToday = isToday(parseISO(report.date));

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent/10",
        isSelected && "bg-primary text-primary-foreground border-primary/80 shadow-md"
      )}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="font-semibold text-sm">{format(parseISO(report.date), 'MMM d, yyyy')}</div>
          <div className={cn("text-xs", isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {format(parseISO(report.date), 'EEEE')}
          </div>
        </div>
        {isReportToday && (
          <Badge variant={isSelected ? 'secondary' : 'default'} className="text-xs">Today</Badge>
        )}
      </div>

      <div className={cn("flex items-center gap-2 text-xs w-full", isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
        <CheckCircle className="h-3 w-3" />
        <span>{report.completed} / {report.goals} completed</span>
        <span className="ml-auto font-medium">{Math.round(completionRate)}%</span>
      </div>

      <div className={cn("w-full rounded-full h-1.5", isSelected ? 'bg-primary-foreground/20' : 'bg-secondary')}>
        <div
          className={cn("h-1.5 rounded-full transition-all", isSelected ? 'bg-primary-foreground' : 'bg-primary')}
          style={{ width: `${completionRate}%` }}
        />
      </div>
    </button>
  );
}
