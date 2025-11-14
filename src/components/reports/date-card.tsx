
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
        "flex w-40 flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent/10 h-full",
        isSelected && "bg-primary text-primary-foreground border-primary/80 shadow-lg"
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="font-semibold">{format(parseISO(report.date), 'MMM d, yyyy')}</div>
          {isReportToday && (
            <div className="ml-auto">
              <Badge variant={isSelected ? 'secondary' : 'default'}>Today</Badge>
            </div>
          )}
        </div>
        <div className={cn("text-xs", isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          {format(parseISO(report.date), 'eeee')}
        </div>
      </div>
      <div className="flex-grow" />
      <div className={cn("flex items-center gap-2 text-xs", isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {report.completed} / {report.goals} done
        </div>
      </div>
      <div className={cn("w-full rounded-full h-1.5", isSelected ? 'bg-primary-foreground/20' : 'bg-secondary')}>
        <div className={cn("h-1.5 rounded-full", isSelected ? 'bg-primary-foreground' : 'bg-primary')} style={{ width: `${completionRate}%` }}></div>
      </div>
    </button>
  );
}
