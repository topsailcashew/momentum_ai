
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
        "flex w-40 flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
        isSelected && "bg-accent shadow-inner border-primary/50"
      )}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center">
          <div className="font-semibold">{format(parseISO(report.date), 'MMM d, yyyy')}</div>
          {isReportToday && (
            <div className="ml-auto">
              <Badge>Today</Badge>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {format(parseISO(report.date), 'eeee')}
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {report.completed} / {report.goals} done
        </div>
      </div>
      <div className="w-full bg-secondary rounded-full h-1.5">
        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${completionRate}%` }}></div>
      </div>
    </button>
  );
}
